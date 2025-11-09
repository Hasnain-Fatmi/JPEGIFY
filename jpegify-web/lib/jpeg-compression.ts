// JPEG Compression Library - TypeScript Implementation

// ==================== Image Utilities ====================

export function isGrayscale(imageData: ImageData): boolean {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] !== data[i + 1] || data[i] !== data[i + 2]) {
      return false;
    }
  }
  return true;
}

export function rgbToYCbCr(r: number, g: number, b: number): [number, number, number] {
  const Y = 0.299 * r + 0.587 * g + 0.114 * b;
  const Cb = -0.169 * r - 0.331 * g + 0.500 * b + 128;
  const Cr = 0.500 * r - 0.419 * g - 0.081 * b + 128;
  return [Y, Cb, Cr];
}

export function ycbcrToRgb(Y: number, Cb: number, Cr: number): [number, number, number] {
  const r = Y + 1.402 * (Cr - 128);
  const g = Y - 0.344 * (Cb - 128) - 0.714 * (Cr - 128);
  const b = Y + 1.772 * (Cb - 128);
  return [
    Math.max(0, Math.min(255, Math.round(r))),
    Math.max(0, Math.min(255, Math.round(g))),
    Math.max(0, Math.min(255, Math.round(b)))
  ];
}

// ==================== DCT Functions ====================

function dct1D(input: number[]): number[] {
  const N = input.length;
  const output = new Array(N);

  for (let k = 0; k < N; k++) {
    let sum = 0;
    for (let n = 0; n < N; n++) {
      sum += input[n] * Math.cos((Math.PI / N) * (n + 0.5) * k);
    }
    const alpha = k === 0 ? Math.sqrt(1 / N) : Math.sqrt(2 / N);
    output[k] = alpha * sum;
  }

  return output;
}

function idct1D(input: number[]): number[] {
  const N = input.length;
  const output = new Array(N);

  for (let n = 0; n < N; n++) {
    let sum = 0;
    for (let k = 0; k < N; k++) {
      const alpha = k === 0 ? Math.sqrt(1 / N) : Math.sqrt(2 / N);
      sum += alpha * input[k] * Math.cos((Math.PI / N) * (n + 0.5) * k);
    }
    output[n] = sum;
  }

  return output;
}

export function applyDCT(block: number[][]): number[][] {
  const shifted = block.map(row => row.map(val => val - 128));

  // Apply DCT to rows
  const rowDCT = shifted.map(row => dct1D(row));

  // Transpose and apply DCT to columns
  const transposed = transpose(rowDCT);
  const colDCT = transposed.map(row => dct1D(row));

  // Transpose back
  return transpose(colDCT);
}

export function applyIDCT(block: number[][]): number[][] {
  // Apply IDCT to rows
  const rowIDCT = block.map(row => idct1D(row));

  // Transpose and apply IDCT to columns
  const transposed = transpose(rowIDCT);
  const colIDCT = transposed.map(row => idct1D(row));

  // Transpose back and shift
  const result = transpose(colIDCT);
  return result.map(row => row.map(val => Math.max(0, Math.min(255, Math.round(val + 128)))));
}

function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, i) => matrix.map(row => row[i]));
}

// ==================== Quantization ====================

export function getQuantizationTables(quality: number): [number[][], number[][]] {
  const yTableBase = [
    [16, 11, 10, 16, 24, 40, 51, 61],
    [12, 12, 14, 19, 26, 58, 60, 55],
    [14, 13, 16, 24, 40, 57, 69, 56],
    [14, 17, 22, 29, 51, 87, 80, 62],
    [18, 22, 37, 56, 68, 109, 103, 77],
    [24, 35, 55, 64, 81, 104, 113, 92],
    [49, 64, 78, 87, 103, 121, 120, 101],
    [72, 92, 95, 98, 112, 100, 103, 99]
  ];

  const cTableBase = [
    [17, 18, 24, 47, 99, 99, 99, 99],
    [18, 21, 26, 66, 99, 99, 99, 99],
    [24, 26, 56, 99, 99, 99, 99, 99],
    [47, 66, 99, 99, 99, 99, 99, 99],
    [99, 99, 99, 99, 99, 99, 99, 99],
    [99, 99, 99, 99, 99, 99, 99, 99],
    [99, 99, 99, 99, 99, 99, 99, 99],
    [99, 99, 99, 99, 99, 99, 99, 99]
  ];

  const scalingFactor = quality < 50 ? 5000 / quality : 200 - 2 * quality;

  const scaleTable = (table: number[][]): number[][] => {
    return table.map(row =>
      row.map(val => Math.max(1, Math.min(255, Math.floor((val * scalingFactor + 50) / 100))))
    );
  };

  return [scaleTable(yTableBase), scaleTable(cTableBase)];
}

export function quantize(dctBlock: number[][], qTable: number[][]): number[][] {
  return dctBlock.map((row, i) =>
    row.map((val, j) => Math.round(val / qTable[i][j]))
  );
}

export function dequantize(quantizedBlock: number[][], qTable: number[][]): number[][] {
  return quantizedBlock.map((row, i) =>
    row.map((val, j) => val * qTable[i][j])
  );
}

// ==================== Zigzag Scanning ====================

const zigzagOrder = [
  0, 1, 8, 16, 9, 2, 3, 10,
  17, 24, 32, 25, 18, 11, 4, 5,
  12, 19, 26, 33, 40, 48, 41, 34,
  27, 20, 13, 6, 7, 14, 21, 28,
  35, 42, 49, 56, 57, 50, 43, 36,
  29, 22, 15, 23, 30, 37, 44, 51,
  58, 59, 52, 45, 38, 31, 39, 46,
  53, 60, 61, 54, 47, 55, 62, 63
];

export function zigzagScan(block: number[][]): number[] {
  const flat = block.flat();
  return zigzagOrder.map(i => flat[i]);
}

export function inverseZigzagScan(zigzag: number[]): number[][] {
  const flat = new Array(64);
  zigzagOrder.forEach((pos, i) => {
    flat[pos] = zigzag[i];
  });

  const block: number[][] = [];
  for (let i = 0; i < 8; i++) {
    block.push(flat.slice(i * 8, (i + 1) * 8));
  }
  return block;
}

// ==================== RLE Encoding ====================

export function rleEncode(zigzag: number[]): [number, number][] {
  const rle: [number, number][] = [];

  // DC coefficient
  rle.push([0, zigzag[0]]);

  // AC coefficients
  let i = 1;
  while (i < zigzag.length) {
    let runLength = 0;
    while (i < zigzag.length && zigzag[i] === 0) {
      runLength++;
      i++;
    }

    if (i >= zigzag.length) {
      rle.push([0, 0]); // EOB marker
      break;
    }

    rle.push([runLength, zigzag[i]]);
    i++;
  }

  return rle;
}

export function rleDecode(rle: [number, number][]): number[] {
  const zigzag = new Array(64).fill(0);
  zigzag[0] = rle[0][1];

  let pos = 1;
  for (let i = 1; i < rle.length; i++) {
    const [runLength, value] = rle[i];

    if (runLength === 0 && value === 0) break; // EOB

    pos += runLength;
    if (pos < 64) {
      zigzag[pos] = value;
    }
    pos++;
  }

  return zigzag;
}

// ==================== Main Compression Functions ====================

export interface CompressionResult {
  compressedData: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  quality: number;
  isGrayscale: boolean;
  width: number;
  height: number;
}

export interface DecompressionResult {
  imageData: ImageData;
  quality: number;
  compressionRatio: number;
}

export function compressImage(
  imageData: ImageData,
  quality: number = 50,
  forceGrayscale: boolean = false
): CompressionResult {
  const { width, height, data } = imageData;
  const gray = forceGrayscale || isGrayscale(imageData);

  const [yTable, cTable] = getQuantizationTables(quality);

  // Convert to YCbCr channels
  const channels = extractChannels(imageData, gray);

  // Process each channel
  const compressed = {
    Y: processChannel(channels.Y, width, height, yTable),
    Cb: gray ? null : processChannel(downsampleChannel(channels.Cb!, width, height), Math.ceil(width / 2), Math.ceil(height / 2), cTable),
    Cr: gray ? null : processChannel(downsampleChannel(channels.Cr!, width, height), Math.ceil(width / 2), Math.ceil(height / 2), cTable)
  };

  // Serialize to JSON
  const compressedData = JSON.stringify({
    ...compressed,
    width,
    height,
    quality,
    isGrayscale: gray,
    yTable,
    cTable: gray ? null : cTable
  });

  const originalSize = data.length;
  const compressedSize = new Blob([compressedData]).size;

  return {
    compressedData,
    originalSize,
    compressedSize,
    compressionRatio: originalSize / compressedSize,
    quality,
    isGrayscale: gray,
    width,
    height
  };
}

export function decompressImage(compressedData: string): DecompressionResult {
  const data = JSON.parse(compressedData);
  const { width, height, quality, isGrayscale: gray, yTable, cTable, Y, Cb, Cr } = data;

  // Decompress channels
  const yChannel = decompressChannel(Y, width, height, yTable);
  let cbChannel: number[][] | null = null;
  let crChannel: number[][] | null = null;

  if (!gray && Cb && Cr) {
    const chromaWidth = Math.ceil(width / 2);
    const chromaHeight = Math.ceil(height / 2);
    cbChannel = upsampleChannel(decompressChannel(Cb, chromaWidth, chromaHeight, cTable), width, height);
    crChannel = upsampleChannel(decompressChannel(Cr, chromaWidth, chromaHeight, cTable), width, height);
  }

  // Convert back to RGB
  const imageData = new ImageData(width, height);
  const pixels = imageData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const Y = yChannel[y][x];

      if (gray) {
        pixels[i] = pixels[i + 1] = pixels[i + 2] = Y;
      } else {
        const Cb = cbChannel![y][x];
        const Cr = crChannel![y][x];
        const [r, g, b] = ycbcrToRgb(Y, Cb, Cr);
        pixels[i] = r;
        pixels[i + 1] = g;
        pixels[i + 2] = b;
      }
      pixels[i + 3] = 255;
    }
  }

  return {
    imageData,
    quality,
    compressionRatio: 0
  };
}

// ==================== Helper Functions ====================

function extractChannels(imageData: ImageData, gray: boolean) {
  const { width, height, data } = imageData;
  const Y: number[][] = Array(height).fill(0).map(() => Array(width));
  const Cb: number[][] = gray ? [] : Array(height).fill(0).map(() => Array(width));
  const Cr: number[][] = gray ? [] : Array(height).fill(0).map(() => Array(width));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (gray) {
        Y[y][x] = 0.299 * r + 0.587 * g + 0.114 * b;
      } else {
        const [y_, cb, cr] = rgbToYCbCr(r, g, b);
        Y[y][x] = y_;
        Cb[y][x] = cb;
        Cr[y][x] = cr;
      }
    }
  }

  return { Y, Cb: gray ? null : Cb, Cr: gray ? null : Cr };
}

function processChannel(channel: number[][], width: number, height: number, qTable: number[][]): any[] {
  const blocks: any[] = [];

  for (let by = 0; by < height; by += 8) {
    for (let bx = 0; bx < width; bx += 8) {
      const block = extractBlock(channel, bx, by, width, height);
      const dct = applyDCT(block);
      const quantized = quantize(dct, qTable);
      const zigzag = zigzagScan(quantized);
      const rle = rleEncode(zigzag);
      blocks.push(rle);
    }
  }

  return blocks;
}

function decompressChannel(blocks: any[], width: number, height: number, qTable: number[][]): number[][] {
  const channel: number[][] = Array(height).fill(0).map(() => Array(width).fill(0));

  let blockIdx = 0;
  for (let by = 0; by < height; by += 8) {
    for (let bx = 0; bx < width; bx += 8) {
      if (blockIdx >= blocks.length) break;

      const rle = blocks[blockIdx++];
      const zigzag = rleDecode(rle);
      const quantized = inverseZigzagScan(zigzag);
      const dct = dequantize(quantized, qTable);
      const block = applyIDCT(dct);

      insertBlock(channel, block, bx, by, width, height);
    }
  }

  return channel;
}

function extractBlock(channel: number[][], x: number, y: number, width: number, height: number): number[][] {
  const block: number[][] = [];
  for (let i = 0; i < 8; i++) {
    const row: number[] = [];
    for (let j = 0; j < 8; j++) {
      const py = Math.min(y + i, height - 1);
      const px = Math.min(x + j, width - 1);
      row.push(channel[py][px]);
    }
    block.push(row);
  }
  return block;
}

function insertBlock(channel: number[][], block: number[][], x: number, y: number, width: number, height: number): void {
  for (let i = 0; i < 8 && y + i < height; i++) {
    for (let j = 0; j < 8 && x + j < width; j++) {
      channel[y + i][x + j] = block[i][j];
    }
  }
}

function downsampleChannel(channel: number[][], width: number, height: number): number[][] {
  const newWidth = Math.ceil(width / 2);
  const newHeight = Math.ceil(height / 2);
  const downsampled: number[][] = Array(newHeight).fill(0).map(() => Array(newWidth));

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const y1 = Math.min(y * 2, height - 1);
      const y2 = Math.min(y * 2 + 1, height - 1);
      const x1 = Math.min(x * 2, width - 1);
      const x2 = Math.min(x * 2 + 1, width - 1);

      downsampled[y][x] = (channel[y1][x1] + channel[y1][x2] + channel[y2][x1] + channel[y2][x2]) / 4;
    }
  }

  return downsampled;
}

function upsampleChannel(channel: number[][], width: number, height: number): number[][] {
  const upsampled: number[][] = Array(height).fill(0).map(() => Array(width));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sy = Math.min(Math.floor(y / 2), channel.length - 1);
      const sx = Math.min(Math.floor(x / 2), channel[0].length - 1);
      upsampled[y][x] = channel[sy][sx];
    }
  }

  return upsampled;
}

export function calculatePSNR(original: ImageData, compressed: ImageData): number {
  const { width, height, data: d1 } = original;
  const d2 = compressed.data;

  let mse = 0;
  for (let i = 0; i < d1.length; i += 4) {
    const diff = d1[i] - d2[i];
    mse += diff * diff;
  }

  mse /= (width * height);

  if (mse === 0) return Infinity;
  return 20 * Math.log10(255 / Math.sqrt(mse));
}
