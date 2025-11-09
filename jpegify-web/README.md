# JPEGIFY - Advanced Image Compression Platform

A professional web-based image compression tool that implements the complete JPEG compression algorithm from scratch using TypeScript and Next.js.

![JPEGIFY Banner](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwind-css)

## Features

- **Full JPEG Algorithm Implementation**
  - Discrete Cosine Transform (DCT)
  - Quantization with quality control (1-100)
  - Zigzag scanning
  - Run-Length Encoding (RLE)
  - Huffman coding
  - YCbCr color space conversion
  - Chroma subsampling (4:2:0)

- **Modern UI/UX**
  - Beautiful gradient design with glassmorphism
  - Drag & drop image upload
  - Real-time compression preview
  - Before/after comparison view
  - Smooth animations with Framer Motion
  - Fully responsive design

- **Advanced Features**
  - Real-time compression statistics
  - PSNR (Peak Signal-to-Noise Ratio) calculation
  - Compression ratio display
  - Processing time measurement
  - Grayscale conversion option
  - Download compressed images

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/jpegify.git
cd jpegify-web
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## How It Works

### 1. Color Space Conversion
Images are converted from RGB to YCbCr color space, separating luminance (Y) from chrominance (Cb, Cr) components.

### 2. Chroma Subsampling
Chrominance channels are downsampled by a factor of 2 in both dimensions (4:2:0 subsampling), reducing data by 50% with minimal perceptual loss.

### 3. Block Splitting & DCT
Images are divided into 8×8 pixel blocks, and each block undergoes Discrete Cosine Transform to convert spatial data to frequency domain.

### 4. Quantization
DCT coefficients are divided by a quantization table (scaled by quality parameter), discarding high-frequency details that are less perceptible to human vision.

### 5. Zigzag Scan
Quantized coefficients are reordered in a zigzag pattern to group low-frequency (more important) coefficients together.

### 6. Run-Length Encoding
Sequences of zeros are compressed using RLE, representing them as (run_length, value) pairs.

### 7. Huffman Coding
RLE data is further compressed using Huffman coding, assigning shorter codes to more frequent symbols.

## Project Structure

```
jpegify-web/
├── app/
│   ├── page.tsx          # Main application component
│   ├── layout.tsx        # Root layout with metadata
│   └── globals.css       # Global styles
├── lib/
│   └── jpeg-compression.ts  # Core compression algorithm
├── public/               # Static assets
├── vercel.json          # Vercel deployment config
└── package.json         # Dependencies
```

## Algorithm Implementation

The compression algorithm is implemented entirely in TypeScript without external compression libraries:

- **DCT/IDCT**: Custom 2D DCT implementation using separable 1D transforms
- **Quantization**: Standard JPEG quantization tables with quality scaling
- **Huffman Coding**: Custom Huffman tree builder and encoder/decoder
- **RLE**: Efficient run-length encoding for AC coefficients
- **Differential Coding**: DC coefficient differences for better compression

## Performance

- Typical compression ratios: **2x - 20x** (depending on quality setting)
- Processing time: **50-500ms** for typical images
- PSNR values: **25-45 dB** (quality-dependent)
- Browser-based processing: **No server required**

## Deployment on Vercel

1. Push your code to GitHub

2. Import the project in Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js configuration

3. Deploy:
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - No environment variables needed

4. Your app will be live at `https://your-project.vercel.app`

## Browser Compatibility

- ✅ Chrome/Edge (Chromium) 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

## Future Enhancements

- [ ] Progressive JPEG support
- [ ] Multiple image batch processing
- [ ] Custom quantization tables
- [ ] DCT visualization
- [ ] Frequency domain editing
- [ ] Compression presets
- [ ] Image format conversion

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your portfolio or learning purposes.

## Acknowledgments

- JPEG specification: ITU-T T.81
- Inspired by the original JPEG compression standard
- Built for educational and portfolio purposes

## Author

Your Name - [Your Portfolio/GitHub]

---

Made with ❤️ using Next.js and TypeScript
