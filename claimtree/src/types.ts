export type Determiner = 'a' | 'an' | 'the' | 'said';

export interface NounPhrase {
  text: string;
  determiner: Determiner;
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
    code:
      | 'MISSING_ANTECEDENT'
      | 'BROKEN_REFERENCE'
      | 'FORWARD_REFERENCE'
      | 'DUPLICATE_ANTECEDENT';
    message: string;
    span: [number, number]; 
  }