import { parseClaimSet } from './index.js';

const SAMPLE = `
1. A widget comprising:
a housing having an interior surface;
a fastener coupled to the housing; and
a sensor disposed within the interior surface.

2. The widget of claim 1, wherein the fastener is a magnetic fastener.

3. The widget of claim 2, wherein the sensor detects a proximity of the magnetic fastener.
`;

const claims = parseClaimSet(SAMPLE);

for (const claim of claims) {
  console.log(`\n--- Claim ${claim.number} (${claim.type}${claim.parent ? `, parent ${claim.parent}` : ''}) ---`);
  console.log('Preamble:', claim.preamble);
  for (const el of claim.elements) {
    console.log(`  Element [${el.span[0]}-${el.span[1]}]: "${el.text}"`);
    for (const np of el.nounPhrases) {
      console.log(`    NP (${np.determiner}) [${np.span[0]}-${np.span[1]}]: "${np.text}"`);
    }
  }
}