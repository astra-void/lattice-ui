const fs = require('fs');
const file = 'tests/vitest/popover/PopoverFlipClamp.test.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `globalThis.game = {
  GetService: (service: string) => {
    if (service === "Workspace") return mockWorkspace;
    if (service === "RunService") return mockRunService;
    if (service === "GuiService") return { GetGuiInset: () => [new Vector2(0, 36), new Vector2(0, 0)] };
    return {};
  }
};`;

content = content.replace(/globalThis\.game = \{\s*GetService: \(service: string\) => \{\s*if \(service === "Workspace"\) return mockWorkspace;\s*if \(service === "RunService"\) return mockRunService;\s*return \{\};\s*\}\s*\};/g, replacement);

fs.writeFileSync(file, content);
