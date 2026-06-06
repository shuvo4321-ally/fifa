const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'app');
const years = fs.readdirSync(appDir).filter(f => /^\d{4}$/.test(f));

for (const year of years) {
  const pagePath = path.join(appDir, year, 'page.js');
  if (!fs.existsSync(pagePath)) continue;
  
  let content = fs.readFileSync(pagePath, 'utf8');

  // 1. Import useMediaQuery
  if (!content.includes('import useMediaQuery')) {
    content = content.replace(
      'import Hero from "../components/Hero";',
      'import Hero from "../components/Hero";\nimport useMediaQuery from "../lib/useMediaQuery";'
    );
  }

  // 2. Remove UP_NEXT_AFTER_MS
  content = content.replace(/const UP_NEXT_AFTER_MS = \d+;\n\n?/, '');

  // 3. Remove showUpNext state
  content = content.replace(/  const \[showUpNext, setShowUpNext\] = useState\(false\);\n/, '');

  // 4. Update isMobile logic
  content = content.replace(
    /  const \[isMobile, setIsMobile\] = useState\(false\);\n  useEffect\(\(\) => \{\n    setIsMobile\(window\.matchMedia\(\"\(max-width: 640px\)\"\)\.matches\);\n  \}, \[\]\);\n/,
    '  const isMobile = useMediaQuery("(max-width: 640px)");\n'
  );

  // 5. Remove setShowUpNext calls
  content = content.replace(/.*setShowUpNext\(.*\);\n/g, '');

  // 6. Remove backToHome function
  const backToHomeRegex = /  const backToHome = \(\) => \{[\s\S]*?\};\n\n/;
  content = content.replace(backToHomeRegex, '');

  // 7. Remove upnext-overlay
  const upNextStart = content.indexOf('{showUpNext && nextMatch && (');
  if (upNextStart !== -1) {
    const upNextEnd = content.indexOf(')}', upNextStart);
    if (upNextEnd !== -1) {
      // Ensure we match the right ending by looking for the line after it
      const exactEnding = '              )}';
      const exactEndingIdx = content.indexOf(exactEnding, upNextStart);
      if (exactEndingIdx !== -1) {
        const lineStart = content.lastIndexOf('\n', upNextStart);
        const afterBlock = content.indexOf('\n', exactEndingIdx + exactEnding.length);
        content = content.substring(0, lineStart) + content.substring(afterBlock);
      }
    }
  }

  // Remove any excessive newlines left behind
  content = content.replace(/\n\n\n+/g, '\n\n');

  fs.writeFileSync(pagePath, content, 'utf8');
  console.log('Processed ' + year);
}
