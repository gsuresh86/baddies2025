const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const optimizedDir = path.join(publicDir, 'optimized');

// Create optimized directory if it doesn't exist
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

// Image formats to optimize
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

// Function to optimize images
async function optimizeImage(inputPath, outputPath, quality = 80) {
  try {
    await sharp(inputPath)
      .jpeg({ quality })
      .toFile(outputPath);
    console.log(`✅ Optimized: ${path.basename(inputPath)}`);
  } catch (error) {
    console.error(`❌ Error optimizing ${inputPath}:`, error);
  }
}

// Function to recursively find and optimize images
async function optimizeImagesInDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .git
      if (file !== 'node_modules' && file !== '.git' && file !== 'optimized') {
        await optimizeImagesInDirectory(filePath);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (imageExtensions.includes(ext)) {
        const relativePath = path.relative(publicDir, filePath);
        const outputPath = path.join(optimizedDir, relativePath);
        
        // Create output directory if it doesn't exist
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        await optimizeImage(filePath, outputPath);
      }
    }
  }
}

// Main execution
async function main() {
  console.log('🖼️  Starting image optimization...');
  await optimizeImagesInDirectory(publicDir);
  console.log('✅ Image optimization complete!');
  console.log(`📁 Optimized images saved to: ${optimizedDir}`);
}

main().catch(console.error); 