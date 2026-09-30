# Catalogue v4
Le catalogue affiche uniquement les cartes jouables SSR, UR et LR. Les captures de Box et les états de possession sont conservés ; les SR sont retirées du catalogue, pas des captures.

Le filtre « Éveils maximum » affiche le dernier stade des chaînes explicitement vérifiées. « Toutes les SSR / UR / LR » permet de consulter les formes intermédiaires. Recherche par nom, SSJ3, ID, catégorie ou lien ; pagination de 60 cartes ; filtres de possession, rareté, type, classe, éveil Z et qualité des informations.

Chaque fiche contient Informations et Éveils Z. Les versions ZTUR, Super ZTUR, ZLR et Super ZLR sont stockées sur le même ID, avec leurs aptitudes et leurs médailles. Aucun doublon de carte n'est ajouté pour un kit Z. Une mention historique EZA ne suffit pas : une version exige un kit vérifié sur son étape exacte, déjà disponible sur Global.

Consulter une version n'affirme pas qu'elle est réalisée. « Utiliser cette version pour mes équipes » enregistre un choix explicite pour les cartes possédées et adapte l'analyse des passifs. Le kit de base reste conservé.

La collecte rapproche les index français et Global de DokkanInfo, puis vérifie chaque ID exact. Les pages qui affichent une forme éveillée à la place de l'ID demandé sont complétées par l'API propre à cet ID, sans surclasser automatiquement la Box. Les ressources d'image proviennent des champs explicites resource_id, asset_id ou icon_id ; aucun suffixe d'ID n'est modifié pour deviner un visuel.

Les images sont décodées et stockées localement. La disponibilité complète est indiquée seulement lorsque le rapport ne contient plus de fiches, kits Z ou images à reprendre. Le rapport détaillé est docs/CATALOG-AUDIT-v4.json, et sa synthèse catalogue-report.json.

Validation : règles du catalogue, versions indépendantes, recherche, pagination, onglet Z, médailles, confirmation de possession, choix du kit pour les équipes, protection du texte des fiches, favoris, potentiel et cache PWA. Les suites existantes de Box, équipes et stockage restent exécutées.
