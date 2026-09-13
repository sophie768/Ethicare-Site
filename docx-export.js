/* Ethicare Resourcing — minimal .docx writer.

   Builds a real, editable Word file from a list of blocks. No dependencies and
   no compression: a store-only zip is a valid .docx, and a CV is a few kilobytes.

   Why Calibri rather than the brand fonts: this file is the candidate's own
   document and gets opened on an employer's machine. A font they do not have is
   substituted silently and the layout shifts, so the export uses a face that is
   present everywhere. The printed PDF from the tool carries the brand type.

   Blocks: { t: 'eyebrow' | 'name' | 'contact' | 'h2' | 'p' | 'bullet' | 'spacer', text }
*/
window.EthicareDocx = (function () {
  const TEAL = '1F5E4E';
  const INK = '243433';
  const RULE = 'E4E9E5';

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
    /* strip control characters Word rejects */
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

  function runs(text, opts) {
    const o = opts || {};
    const rPr = '<w:rPr>'
      + '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>'
      + (o.bold ? '<w:b/>' : '')
      + (o.caps ? '<w:caps/>' : '')
      + (o.spacing ? '<w:spacing w:val="' + o.spacing + '"/>' : '')
      + '<w:color w:val="' + (o.color || INK) + '"/>'
      + '<w:sz w:val="' + (o.size || 22) + '"/>'
      + '<w:szCs w:val="' + (o.size || 22) + '"/>'
      + '</w:rPr>';
    /* Soft line breaks inside one paragraph keep grouped lists together. */
    const parts = String(text == null ? '' : text).split('\n');
    return parts.map((p, i) => '<w:r>' + rPr
      + (i ? '<w:br/>' : '')
      + '<w:t xml:space="preserve">' + esc(p) + '</w:t></w:r>').join('');
  }

  function para(text, opts) {
    const o = opts || {};
    const pPr = '<w:pPr>'
      + '<w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after == null ? 80 : o.after) + '" w:line="' + (o.line || 250) + '" w:lineRule="auto"/>'
      + (o.hanging ? '<w:ind w:left="' + o.hanging + '" w:hanging="' + o.hanging + '"/>' : '')
      + (o.rule ? '<w:pBdr><w:bottom w:val="single" w:sz="4" w:space="2" w:color="' + RULE + '"/></w:pBdr>' : '')
      + (o.keepNext ? '<w:keepNext/>' : '')
      + '</w:pPr>';
    return '<w:p>' + pPr + runs(text, o) + '</w:p>';
  }

  const STYLE = {
    eyebrow: { size: 19, bold: true, caps: true, color: '437A5B', spacing: 20, after: 60 },
    name: { size: 40, bold: true, color: TEAL, after: 60, line: 240 },
    contact: { size: 20, after: 40 },
    h2: { size: 21, bold: true, caps: true, color: TEAL, spacing: 20, before: 240, after: 100, rule: true, keepNext: true },
    sub: { size: 21, bold: true, color: TEAL, after: 20, keepNext: true },
    p: { size: 21, after: 80 },
    bullet: { size: 21, after: 40, hanging: 170 }
  };

  function body(blocks) {
    return blocks.map(b => {
      if (b.t === 'spacer') return para('', { after: 0, size: 12 });
      if (b.t === 'bullet') return para('\u2014\u2003' + b.text, STYLE.bullet);
      const s = STYLE[b.t] || STYLE.p;
      return para(b.text, s);
    }).join('');
  }

  /* A4 portrait, 15mm margins — the standard the CV guidance asks for. */
  const SECT = '<w:sectPr>'
    + '<w:pgSz w:w="11906" w:h="16838"/>'
    + '<w:pgMar w:top="850" w:right="850" w:bottom="850" w:left="850" w:header="0" w:footer="0" w:gutter="0"/>'
    + '</w:sectPr>';

  function documentXml(blocks) {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
      + '<w:body>' + body(blocks) + SECT + '</w:body></w:document>';
  }

  const CONTENT_TYPES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    + '</Types>';

  const RELS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    + '</Relationships>';

  const CRC = (function () {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(u8) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function zip(files) {
    const enc = new TextEncoder();
    const chunks = [], central = [];
    let offset = 0;

    const u16 = (n) => [n & 0xFF, (n >>> 8) & 0xFF];
    const u32 = (n) => [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF];

    files.forEach(f => {
      const name = enc.encode(f.name);
      const data = enc.encode(f.data);
      const crc = crc32(data);
      const local = [].concat(
        u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0),
        u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0)
      );
      chunks.push(new Uint8Array(local), name, data);
      central.push([].concat(
        u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0),
        u32(crc), u32(data.length), u32(data.length),
        u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset)
      ));
      central.push(name);
      offset += local.length + name.length + data.length;
    });

    const cdBytes = [];
    central.forEach(c => { (c instanceof Uint8Array ? Array.from(c) : c).forEach(b => cdBytes.push(b)); });
    const eocd = [].concat(
      u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
      u32(cdBytes.length), u32(offset), u16(0)
    );
    chunks.push(new Uint8Array(cdBytes), new Uint8Array(eocd));
    return new Blob(chunks, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  function build(blocks) {
    return zip([
      { name: '[Content_Types].xml', data: CONTENT_TYPES },
      { name: '_rels/.rels', data: RELS },
      { name: 'word/document.xml', data: documentXml(blocks) }
    ]);
  }

  function download(blocks, filename) {
    const url = URL.createObjectURL(build(blocks));
    const a = document.createElement('a');
    a.href = url;
    a.download = (filename || 'CV') + '.docx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  return { build: build, download: download };
})();
