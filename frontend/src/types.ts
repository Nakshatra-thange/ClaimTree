export interface NounPhrase {
    text: string;
    determiner: string;
    span: [number, number];
  }
  
  export interface ClaimElement {
    id: string;
    text: string;
    span: [number, number];
    nounPhrases: NounPhrase[];
  }
  
  export interface Claim {
    number: number;
    type: 'independent' | 'dependent';
    parent?: number;
    preamble: string;
    elements: ClaimElement[];
    rawText: string;
    offset: number;
  }
  
  export interface Issue {
    claimNumber: number;
    severity: 'error' | 'warning';
    code: string;
    message: string;
    span: [number, number];
  }
  
  export interface ParseResponse {
    claimSetId: number;
    claims: Claim[];
    issues: Issue[];
  }