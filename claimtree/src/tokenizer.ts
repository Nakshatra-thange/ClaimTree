export interface ClaimBlock {
    number: number;
    text: string;
    offset: number; 
  }

  const CLAIM_HEADER = /(?:^|\n)\s*(\d+)\.\s+/g;
  
  export function splitClaimSet(rawText: string): ClaimBlock[] {
    const headers: { index: number; num: number; contentStart: number }[] = [];
    let match: RegExpExecArray | null;
  
    const re = new RegExp(CLAIM_HEADER);
    while ((match = re.exec(rawText)) !== null) {
      headers.push({
        index: match.index,
        num: parseInt(match[1], 10),
        contentStart: match.index + match[0].length,
      });
    }
  
    if (headers.length === 0) {
      throw new Error(
        'No numbered claims found. Expected format like "1. A widget comprising...".'
      );
    }
  
    const blocks: ClaimBlock[] = [];
    for (let i = 0; i < headers.length; i++) {
      const start = headers[i].contentStart;
      const end = i + 1 < headers.length ? headers[i + 1].index : rawText.length;
      blocks.push({
        number: headers[i].num,
        text: rawText.slice(start, end).trim(),
        offset: start,
      });
    }
    return blocks;
  }