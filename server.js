const express = require('express');
const { spawn } = require('child_process');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.post('/convert', (req, res) => {
    const url = req.body.url;

    // Validasi URL
    if (!url) {
        return res.status(400).send('Invalid YouTube URL');
    }

    // Pertama, kita ambil informasi video untuk mendapatkan judul
    const infoProcess = spawn('yt-dlp', ['--get-title', url]);

    let title = '';

    // Ambil judul dari output
    infoProcess.stdout.on('data', (data) => {
        title = data.toString().trim();
    });

    infoProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`yt-dlp process exited with code ${code}`);
            return res.status(500).send('Error retrieving video title');
        }

        // Mengatur header untuk mengunduh file
        res.header('Content-Disposition', `attachment; filename="${title}.mp3"`);
        res.header('Content-Type', 'audio/mpeg');

        // Menggunakan yt-dlp untuk mengunduh audio
        const ytDlp = spawn('yt-dlp', ['-x', '--audio-format', 'mp3', '-o', '-', url]);

        // Mengalirkan output dari yt-dlp ke respons
        ytDlp.stdout.pipe(res);

        // Menangani kesalahan
        ytDlp.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        ytDlp.on('close', (code) => {
            if (code !== 0) {
                console.error(`yt-dlp process exited with code ${code}`);
                return res.status(500).send('Error during conversion');
            }
        });
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});