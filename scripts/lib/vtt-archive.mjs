import { deflateRawSync } from 'node:zlib';

function crc32(input) {
  let crc = 0xffffffff;
  for (const byte of input) {
    crc ^= byte;
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
export function vttArchive(state) {
  const filename = Buffer.from('0.json', 'utf8');
  const original = Buffer.from(JSON.stringify(state, null, 2) + '\n', 'utf8');
  const compressed = deflateRawSync(original);
  const crc = crc32(original);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); // Local file header
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(8, 8);         // DEFLATE
  local.writeUInt16LE(33, 12);       // 1980-01-01, valid MS-DOS ZIP date
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(original.length, 22);
  local.writeUInt16LE(filename.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0); // Central-directory entry
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(33, 14);     // 1980-01-01
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(original.length, 24);
  central.writeUInt16LE(filename.length, 28);
  central.writeUInt32LE(0, 42); // offset of local header
  const centralStart = local.length + filename.length + compressed.length;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); // End of central directory
  end.writeUInt16LE(1, 8);         // one entry on this disk
  end.writeUInt16LE(1, 10);        // one entry in archive
  end.writeUInt32LE(central.length + filename.length, 12);
  end.writeUInt32LE(centralStart, 16);
  return Buffer.concat([local, filename, compressed, central, filename, end]);
}
