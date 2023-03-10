#! /usr/bin/env node

(async () => {
    const fs = require('fs');
    const {replaceLinksToInline, Green, Red, Cyan} = require("../src/replace-links-to-inline");


    const args = process.argv.slice(2);
    if (args.length !== 2) {
        console.error(Red, 'The first argument should be path to entrypoint html file, the second one should be output path');
        process.exit(1);
    }
    args.forEach(arg => {
        if (typeof arg !== 'string') {
            console.error(Red, 'Args should be strings');
            process.exit(1);
        }
    });
    const input = args[0];
    let output = args[1];
    if (!output.endsWith('.html')) {
        output = `${output}/index_${Date.now()}.html`;
    }

    try {
        const updatedHtmlContent = await replaceLinksToInline(input);
        fs.writeFileSync(output, updatedHtmlContent);
        console.log(Cyan, '(◕‿◕✿)');
        console.log(Cyan, 'All replacements have done! Have a nice day!');
    } catch (err) {
        console.log(Red, 'Something went wrong');
        console.error(err);
    }

    process.exit(0);
})()
