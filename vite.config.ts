import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

function photoUploadPlugin() {
  return {
    name: 'photo-upload-middleware',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.method === 'POST' && req.url === '/api/upload-photo') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              const { filename, dataUrl } = JSON.parse(body);
              if (filename && dataUrl) {
                const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                const photosDir = path.resolve(__dirname, 'public/school-photos');
                if (!fs.existsSync(photosDir)) {
                  fs.mkdirSync(photosDir, { recursive: true });
                }
                fs.writeFileSync(path.resolve(photosDir, filename), buffer);

                if (filename === 'logo.jpg') {
                  fs.writeFileSync(path.resolve(__dirname, 'public/logo.jpg'), buffer);
                  fs.writeFileSync(path.resolve(__dirname, 'src/assets/logo.jpg'), buffer);
                }

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, filename }));
                return;
              }
            } catch (err: any) {
              console.error('Error saving uploaded photo:', err);
            }
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false }));
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), photoUploadPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'process.env.FIREBASE_API_KEY': JSON.stringify('AIzaSyBPczm2HxZHOXy6x_lbSHT-A4Zcm32lCv0'),
      'process.env.VITE_FIREBASE_API_KEY': JSON.stringify('AIzaSyBPczm2HxZHOXy6x_lbSHT-A4Zcm32lCv0'),
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify('AIzaSyBPczm2HxZHOXy6x_lbSHT-A4Zcm32lCv0'),
      'import.meta.env.FIREBASE_API_KEY': JSON.stringify('AIzaSyBPczm2HxZHOXy6x_lbSHT-A4Zcm32lCv0'),
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
