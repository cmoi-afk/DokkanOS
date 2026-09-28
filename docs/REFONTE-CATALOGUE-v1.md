# DokkanOS — Refonte catalogue v1

Point de départ : `main@bb486ef10d601ac847b33554fc26e1d5901f2e71`.

Sauvegarde immuable de travail : `backup/pre-catalog-refonte-2026-09-28`.

## Principes
- L'ID Dokkan réel est la clé canonique.
- Une carte jouable = une entrée canonique ; aucun doublon d'ID.
- Périmètre : LR, UR, SSR, plus SR uniquement lorsqu'un éveil utile est vérifié.
- Les cartes/objets vendables et non jouables (ex. statues de M. Satan) sont exclus.
- Les identités et chaînes d'éveil ne sont jamais déduites d'une simple proximité d'ID sans preuve.
- Les données affichées doivent utiliser la terminologie française vérifiée.
- Une image locale vérifiée est préférée à une URL externe.
- Une URL externe cassée n'est jamais remplacée par une image supposée.
- Les données de collection utilisateur restent séparées du catalogue maître.

## Gates de sortie
1. Catalogue canonique sans doublon ni ID vide.
2. Périmètre jouable audité.
3. Chaînes SR/SSR/UR/LR auditées.
4. Terminologie visible française auditée.
5. Images vérifiées et associations ID/image auditées.
6. Tests fonctionnels : recherche, À vérifier, Manquantes, sélection, persistance, filtres.
7. Audit final neuf, sans dépendance aux anciens rapports.

Les anciens rapports restent historiques et ne doivent plus servir de source de vérité pour la refonte.
