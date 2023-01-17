const fs = require('fs');
const path = require('path');

export function replaceLinksToInline(filePath) {
    const rootPath = path.dirname(filePath);

    // Replace scripts
    let data = fs.readFileSync(filePath, 'utf8');

    if (data) {
        console.log(`Lets start replacing in ${filePath}`);
        const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi;
        let match;
        while (match = scriptRegex.exec(data)) {
            console.log(`Attempt to replace SCRIPT tag to ${match[1]}...`);
            const scriptPath = path.resolve(rootPath, match[1]);
            const script = fs.readFileSync(scriptPath, 'utf8');
            if (script) {
                data = data.replace(match[0], `<script>${script}</script>`);
                if (!scriptRegex.test(data)) {
                    console.log(`${match[1]} replaced successfully`);
                }
            } else {
                console.log(`WARNING: File ${match[1]} wasn't found. We looked for it in ${rootPath}/${match[1]}`);
            }
        }

        // Replace tagged styles and fonts
        const linkRegex = /<link[^>]*href=["']([^"']+)["'][^>]*>/gi;
        match = undefined;

        while (match = linkRegex.exec(data)) {
            console.log(`Attempt to replace LINK tag to ${match[1]}...`);
            switch (true) {
                case match[1].endsWith('.css'):
                    const cssPath = path.resolve(rootPath, match[1]);
                    let cssContent = fs.readFileSync(cssPath, 'utf8');
                    if (cssContent) {
                        cssContent = replaceUrlInCss(cssContent, cssPath);
                        data = data.replace(match[0], `<style>${cssContent}</style>`);
                        console.log(`${match[1]} replaced successfully`);
                    } else {
                        console.log(`WARNING: File ${match[1]} wasn't found. We looked for it in ${rootPath}/${match[1]}`);
                    }
                    break;
                case match[1].endsWith('woff') ||
                match[1].endsWith('woff2') ||
                match[1].endsWith('eot') ||
                match[1].endsWith('ttf') ||
                match[1].endsWith('svg'):
                    const fontPath = path.resolve(rootPath, match[1]);
                    const fontContent = fs.readFileSync(fontPath);
                    if (fontContent) {
                        const fontContentEncoded = fontContent.toString('base64');
                        const fontType = path.extname(match[1]).substring(1);
                        const fontUrl = `data:application/x-${fontType};base64,${fontContentEncoded}`;
                        data = data.replace(match[0], `<link href="${fontUrl}" rel="stylesheet">`);
                        console.log(`${match[1]} replaced successfully`);
                    } else {
                        console.log(`WARNING: File ${match[1]} wasn't found. We looked for it in ${rootPath}/${match[1]}`);
                    }
                    break;
                default:
                    break;
            }
        }
        console.log('Links replaced successfully');
        return data;
    } else {
        console.log(`WARNING: Html source file wasn't found in ${filePath}`);
    }
}

function replaceUrlInCss(sourceCss, cssPath) {
    const cssRegex = /url\((['"]?)([^'"]+)\1\)/gi;
    let match;
    let result = sourceCss;
    while ((match = cssRegex.exec(sourceCss)) !== null) {
        console.log(`Attempt to replace URL ${match[2]} in CSS ${cssPath} `);
        const assetPath = path.resolve(path.dirname(cssPath), match[2]);
        const assetContent = fs.readFileSync(assetPath, 'utf8');
        if (assetContent) {
            const assetDataUrl = `data:${mime.getType(path.extname(assetPath))};charset=utf-8,${encodeURIComponent(assetContent)}`;
            result = sourceCss.replace(match[0], `url(${assetDataUrl})`);
            console.log(`${match[2]} replaced successfully`);
        } else {
            console.log(`WARNING: File ${match[2]} wasn't found. We looked for it in ${assetPath}`);
        }
    }
    console.log('Urls in css files replaced successfully');
    return result;
}
