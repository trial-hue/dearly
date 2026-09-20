# ADR 0003: Money as integer pence

- Context: prices are given in pounds; floating-point addition of 3.99 and 1.90 does not equal 5.89 exactly.
- Decision: the domain converts every constant to integer pence at the boundary (`toPence`) and does all arithmetic in pence; the database stores pence; the interface formats pence at the edge.
- Alternatives: decimal library (extra dependency for two-decimal money); rounding at display time only (drift accumulates in totals and contribution).
- Consequences: unit checks compare exact integers; VAT and percentage costs are rounded once per line, which keeps contributions within a penny of the product spec.
- Date: 2026-09-20
