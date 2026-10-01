# Événements GLOBAL FR — v1.6

L’onglet Événements rassemble le catalogue public GLOBAL français, les niveaux, les récompenses de première réussite et les missions extraites. Les dates de disponibilité proviennent de la source et restent à comparer au jeu. Les anciennes éditions restent accessibles avec le filtre **Tous** ou **Fermés / récurrents**.

Choisir un niveau, cocher une ou plusieurs missions puis appuyer sur **Préparer l’équipe** transmet les quotas au constructeur. Les quotas identiques prennent le plus grand nombre demandé ; des catégories différentes restent deux conditions à remplir simultanément. Les règles concernant l’ami conservent leur portée. Le constructeur travaille uniquement sur les cartes confirmées de la Box. La génération ne valide aucune mission en jeu.

**Réalisée** et **Récompense récupérée** sont deux confirmations distinctes, enregistrées sur cet appareil. Décocher une mission réinitialise la confirmation de récupération. Le compteur de pierres restantes compte les récompenses de missions encore accessibles et non récupérées ; le total source des événements inclut les niveaux et n’y est pas ajouté.

Les contraintes automatiques sont celles explicitement identifiées dans la source. Les restrictions non interprétées, les objectifs pendant le combat et les modes spéciaux restent à vérifier. Pettan utilise des stickers : le constructeur de six cartes est désactivé. Les équipes de Bataille Royale, Dokkan Frontier et Burst Mode nécessitent une vérification spécifique des règles et des effectifs. Les images des objets dont le nom n’est pas fourni restent référencées sans inventer une récompense.

## Mise à jour et audit

`tools/refresh_events.py` parcourt les index et leurs pages liées, extrait les données et produit `event-source/events.json` et `audit.json`. Python 3.12 et beautifulsoup4 4.14.3 sont utilisés. `tools/publish_event_snapshot.py` valide le résultat et conserve les identifiants historiques, masqués dans le catalogue, pour ne pas perdre la progression ou les préréglages existants.

Le workflow **Collect GLOBAL French events** permet une collecte manuelle. Le commit automatique est limité à la branche de travail `feat/events-v16` ; une exécution sur une autre branche fournit l’export à importer et à examiner. Aucun calendrier de mise à jour automatique n’est créé. `docs/events-audit.json` expose les pages indisponibles et les nombres par famille. L’application indique une couverture partielle tant que les règles propres aux modes spéciaux et les récompenses non nommées n’ont pas été intégralement vérifiées.

Source : https://www.dbz-dokkanbattle.com (base communautaire, GLOBAL FR).
