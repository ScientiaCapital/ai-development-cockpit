const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const templatesDir = path.join(__dirname, '..', 'templates');
const outputFile = path.join(__dirname, '..', 'public', 'templates.json');

function parseTemplate(trade, file) {
  const filePath = path.join(templatesDir, trade, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = yaml.load(content);

  const groups = (parsed.groups || []).map(g => ({
    name: g.name,
    order: g.order,
    fields: (g.fields || []).map(f => ({
      name: f.name,
      type: f.type,
      required: f.required || false,
      options: f.options || null
    }))
  }));

  const fieldsCount = groups.reduce((sum, g) => sum + g.fields.length, 0);

  return {
    trade: parsed.metadata?.trade || trade,
    name: parsed.template?.name || file.replace('.yaml', ''),
    file,
    slug: file.replace('.yaml', ''),
    emoji: parsed.template?.emoji || '',
    description: parsed.template?.description || '',
    phase: parsed.template?.category || null,
    category: parsed.template?.category,
    work_order_type: parsed.template?.work_order?.type,
    fields_count: fieldsCount,
    groups_count: groups.length,
    groups
  };
}

function main() {
  const trades = fs.readdirSync(templatesDir).filter(f =>
    fs.statSync(path.join(templatesDir, f)).isDirectory()
  );

  const data = {
    trades: [],
    templates: {}
  };

  trades.forEach(trade => {
    const tradeDir = path.join(templatesDir, trade);
    const files = fs.readdirSync(tradeDir).filter(f => f.endsWith('.yaml'));

    const phases = {};
    const templates = [];

    files.forEach(file => {
      try {
        const template = parseTemplate(trade, file);
        templates.push(template);
        const phase = template.category || 'General';
        phases[phase] = (phases[phase] || 0) + 1;
      } catch (e) {
        console.error(`Error parsing ${trade}/${file}:`, e.message);
      }
    });

    data.trades.push({
      trade,
      count: templates.length,
      phases
    });

    data.templates[trade] = templates;
  });

  data.total_templates = data.trades.reduce((sum, t) => sum + t.count, 0);

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));

  console.log(`Generated ${data.total_templates} templates across ${data.trades.length} trades`);
  console.log(`Output: ${outputFile}`);
}

main();
