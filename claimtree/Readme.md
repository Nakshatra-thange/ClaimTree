I'm building a deterministic, rule-based engine that parses patent claims into a structured dependency tree—not an LLM wrapper. The core value is a hand-coded grammar parser that validates formal claim grammar: independent/dependent relationships, antecedent basis (every "the" needs a prior "a"), dependency chain integrity, and multi-dependent numbering errors. The LLM is purely an optional sidecar for suggesting fixes, never the primary logic. I want the tool to be the antithesis of AI hype—reliable, transparent, and mathematically verifiable, like a linter for patent law.





