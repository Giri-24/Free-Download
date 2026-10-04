import express from 'express';
import cors from 'cors';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const app = express();
const PORT = process.env.PORT || 3000;
const YTDLP = process.env.YTDLP_PATH || 'yt-dlp';
const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || path.resolve('downloads');
fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
app.use(cors());
app.use(express.json({ limit: '64kb' }));

function validUrl(value) {
  try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol); } catch { return false; }
}
function runYtdlp(args) {
  return new Promise((resolve, reject) => {
    const p = spawn(YTDLP, args, { stdio: ['ignore','pipe','pipe'] });
    let out='', err='';
    p.stdout.on('data', d => out += d);
    p.stderr.on('data', d => err += d);
    p.on('error', reject);
    p.on('close', code => code === 0 ? resolve(out) : reject(new Error(err || `yt-dlp exited with ${code}`)));
  });
}

app.get('/api/health', (_req,res) => res.json({ok:true, service:'yt-dlp-web'}));

app.post('/api/info', async (req,res) => {
  const url = req.body?.url;
  if (!validUrl(url)) return res.status(400).json({error:'Enter a valid http(s) URL.'});
  try {
    const raw = await runYtdlp(['--dump-single-json','--no-warnings','--skip-download',url]);
    const info = JSON.parse(raw);
    const formats = (info.formats || []).filter(f => f.url && (f.vcodec !== 'none' || f.acodec !== 'none')).map(f => ({
      id:f.format_id, ext:f.ext, resolution:f.resolution || null, width:f.width || null, height:f.height || null,
      fps:f.fps || null, vcodec:f.vcodec || null, acodec:f.acodec || null, abr:f.abr || null, tbr:f.tbr || null,
      filesize:f.filesize || f.filesize_approx || null, protocol:f.protocol || null
    }));
    res.json({id:info.id,title:info.title,thumbnail:info.thumbnail,duration:info.duration,channel:info.channel,uploader:info.uploader,webpage_url:info.webpage_url,formats});
  } catch (e) { res.status(422).json({error:e.message}); }
});


app.get('/api/stream', async (req,res) => {
  const url = req.query.url;
  if (!validUrl(url)) return res.status(400).json({error:'Invalid URL'});
  try {
    const direct = (await runYtdlp(['--get-url','--no-playlist','--no-warnings','-f','best[ext=mp4]/best',url])).trim().split(/\r?\n/).pop();
    if (!direct) throw new Error('No playable media URL was returned');
    res.redirect(direct);
  } catch (e) { res.status(422).json({error:e.message}); }
});

app.get('/api/download', async (req,res) => {
  const url = req.query.url; const quality = req.query.quality || 'best';
  if (!validUrl(url)) return res.status(400).json({error:'Invalid URL'});
  const allowed = new Set(['best','2160','1440','1080','720','480','360','240','audio']);
  if (!allowed.has(quality)) return res.status(400).json({error:'Unsupported quality'});
  const token = crypto.randomBytes(8).toString('hex');
  const template = path.join(DOWNLOAD_DIR, `${token}-%(title).120B.%(ext)s`);
  let format = 'bv*+ba/b';
  if (quality !== 'best' && quality !== 'audio') format = `bv*[height<=${quality}]+ba/b[height<=${quality}]`;
  if (quality === 'audio') format = 'ba/b';
  const args = ['--no-playlist','--no-warnings','--format',format,'--merge-output-format','mp4','--restrict-filenames','-o',template,url];
  try {
    const output = await runYtdlp(args);
    const files = fs.readdirSync(DOWNLOAD_DIR).filter(x => x.startsWith(token+'-'));
    if (!files.length) throw new Error('Output file was not created');
    const file = files[0];
    res.download(path.join(DOWNLOAD_DIR,file), file, () => { try { fs.unlinkSync(path.join(DOWNLOAD_DIR,file)); } catch {} });
  } catch (e) { res.status(422).json({error:e.message}); }
});

app.use(express.static(path.resolve('../frontend')));
app.use((_req,res) => res.sendFile(path.resolve('../frontend/index.html')));
app.listen(PORT, () => console.log(`yt-dlp web app listening on ${PORT}`));
