const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const Red = "\x1b[31m%s\x1b[0m"
const Green = "\x1b[32m%s\x1b[0m"
const Yellow = "\x1b[33m%s\x1b[0m"
const Cyan = "\x1b[36m%s\x1b[0m"

module.exports.Red = Red;
module.exports.Cyan = Cyan;
module.exports.Green = Green;
module.exports.Yellow = Yellow;

module.exports.replaceLinksToInline = async function replaceLinksToInline(filePath) {
    const rootPath = path.dirname(filePath);

    let data = fs.readFileSync(filePath, 'utf8');

    if (data) {
        console.log(Cyan, `Lets start replacing in ${filePath}`);
        const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi;
        let allMatches = [...data.matchAll(scriptRegex)];
        for (const match of allMatches) {
            console.log(`Replacing SCRIPT ${match[1]}...`);
            const scriptPath = path.resolve(rootPath, match[1]);
            const script = await readFile(scriptPath);
            if (script) {
                data = replace(data, match[0], `<script defer>${script}</script>`);
                console.log(Green, `${match[1]} replaced successfully`);
            } else {
                console.log(Red, `WARNING: File ${match[1]} wasn't found. We looked for it in ${rootPath}/${match[1]}`);
            }
        }

        const linkRegex = /<link[^>]*href=["']([^"']+)["'][^>]*>/gi;
        allMatches = data.matchAll(linkRegex);
        for (const match of allMatches) {
            console.log(`Replacing LINK ${match[1]}...`);
            switch (true) {
                case match[1].endsWith('.css'):
                    const cssPath = path.resolve(rootPath, match[1]);
                    let cssContent = await readFile(cssPath);
                    if (cssContent) {
                        cssContent = await replaceUrlInCss(cssContent, cssPath);
                        data = replace(data, match[0], `<style>${cssContent}</style>`);
                        console.log(Green, `${match[1]} replaced successfully`);
                    } else {
                        console.log(Red, `WARNING: File ${match[1]} wasn't found. We looked for it in ${rootPath}/${match[1]}`);
                    }
                    break;
                case match[1].endsWith('woff') ||
                match[1].endsWith('woff2') ||
                match[1].endsWith('eot') ||
                match[1].endsWith('ttf') ||
                match[1].endsWith('svg'):
                    const fontPath = path.resolve(rootPath, match[1]);
                    const fontContent = await readFile(fontPath);
                    if (fontContent) {
                        const fontContentEncoded = fontContent.toString('base64');
                        const fontType = path.extname(match[1]).substring(1);
                        const fontUrl = `data:application/x-${fontType};base64,${fontContentEncoded}`;
                        data = replace(data, match[0], `<link href="${fontUrl}" rel="stylesheet">`);
                        console.log(Green, `${match[1]} replaced successfully`);
                    } else {
                        console.log(Red, `WARNING: File ${match[1]} wasn't found. We looked for it in ${rootPath}/${match[1]}`);
                    }
                    break;
                default:
                    console.log(Red, `WARNING: Instruction for ${match[1]} not found!`);
                    break;
            }
        }
        return data;
    } else {
        console.log(Red, `WARNING: Html source file wasn't found in ${filePath}`);
    }
}

async function replaceUrlInCss(sourceCss, cssPath) {
    const cssRegex = /url\(([^)]+)\)/gi;
    const allMatches = sourceCss.matchAll(cssRegex);
    let result = sourceCss;
    for (const match of allMatches) {
        match[1] = match[1].split('?#')[0];
        console.log(`Replacing URL ${match[1]} in CSS ${cssPath}...`);
        const assetPath = path.resolve(path.dirname(cssPath), match[1]);
        const assetBuffer = fs.readFileSync(assetPath);
        const assetContent = convertBufferToBase64(assetBuffer);
        if (assetContent) {
            let mimeType = mime.lookup(path.extname(assetPath));
            let assetDataUrl = `data:${mimeType};base64,${assetContent}`;
            result = replace(result, match[0], `url(${assetDataUrl})`);
            console.log(Green, `${match[1]} replaced successfully`);
        } else {
            console.log(Red, `WARNING: File ${match[1]} wasn't found. We looked for it in ${assetPath}`);
        }
    }
    console.log(Green, 'Urls in css files replaced successfully');
    return result;
}

function convertBufferToBase64(content) {
    return Buffer.from(content).toString('base64');
}

async function readFile(path) {
    return new Promise((resolve, reject) => {
        let data = '';
        const readStream = fs.createReadStream(path, 'utf-8');
        readStream.on('error', (error) => reject(error.message));
        readStream.on('data', (chunk) => data += chunk);
        readStream.on('end', () => resolve(data));
    });
}

function replace(input, source, target) {
    return input.split(source).join(target);
}
