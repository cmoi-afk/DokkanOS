# Copilote DokkanOS · v1.9

Accessible dans **Plus → Copilote**, depuis une équipe ou depuis une fiche de carte.

| Outil | Fonctionnement | Limite explicite |
| --- | --- | --- |
| Guide de combat | Composition actuelle, diagnostic, deux rotations disjointes, flottants, mise en place et conditions d’actives | Ordre de départ, compteurs et dégâts inconnus |
| Passifs | Sections du kit choisi, état des conditions et conseils de timing | Une condition de combat ne devient pas automatiquement active |
| Équipements | Priorités expliquées, objectif et esquive désactivée pris en compte, valeurs manuelles conservées | Pas de calcul de build optimal ni de dégâts |
| Plusieurs missions | Jusqu’à douze missions du même niveau, contraintes du niveau incluses, recherche en worker et sélection de groupes | Groupes de composition approchés ; victoire et actions à confirmer |
| Farming | Chaîne d’éveil, médailles Z vérifiées, stock saisi, ressources et niveaux associés manuellement | Les rapprochements d’événements par nom ne prouvent pas un drop |
| Après une défaite | Carte, tour, position, moment et problème ; pistes d’ajustement conservées | Hypothèses à tester, pas une reconstitution du combat |
| Captures | Descripteurs visuels locaux, grille cadrée manuellement, cinq suggestions par position et recherche alternative | Pas d’ajout avant confirmation ; pas de comptage automatique des doublons |
| Compléter mon équipe | Remplacements hypothétiques classés sur les kits, gains/pertes et alternatives possédées | Aucun conseil de dépense ou taux de victoire |
| Partage | Fiche texte, code JSON validé, aperçu des cartes non possédées et chargement des cartes confirmées | L’inventaire et les versions de kit ne sont pas modifiés par le code |
| Mode rapide | Box par lots, écrans secondaires différés, missions lourdes à la demande, cache versionné, images de Box préparables | Images non consultées à charger ou préparer avant usage hors ligne |

Les données personnelles `dokkanos-copilot-v1` et `dokkanos-performance-v1` font partie de la sauvegarde complète. Les captures restent en mémoire de la session et ne sont pas envoyées ni incluses dans la sauvegarde.

Les index se reconstruisent depuis les données du dépôt :

```sh
python tools/build_event_preview.py
python tools/build_visual_index.py
```

Tests de modèle : `node tools/test_copilot.cjs`. L’audit navigateur vérifie les dix outils sur mobile et ordinateur, les imports invalides, l’identification d’une image de référence, la confirmation explicite de possession, la conservation des saisies et le hors ligne.

## v2.0 — Préparation et progression

Copilote propose dix outils supplémentaires : profil réel (ATT SP, potentiel, éveil, liens), compteurs manuels, combat compact, construction autour de deux cartes, boss, historique des compositions, objectifs personnels, suivi des collectes, sources exactes des médailles et connexion de synchronisation.

Le profil utilise le kit vérifié de l'éveil déclaré ; potentiel et niveaux de liens alimentent la liste de préparation, sans calcul de dégâts. Les compteurs sont remis à zéro quand l'identité de l'équipe/objectif change. Les seuils reconnus sont des rappels à vérifier en jeu, jamais des preuves d'activation. Les conditions qui ne sont pas reconnues restent dans le texte intégral.

L'historique conserve 100 versions distinctes après stabilisation des modifications, avec composition, kits, leader et objectif. Restaurer une version reprend les cartes actuellement possédées et les kits actuellement sélectionnés ; les profils réels ne sont pas écrasés.

Les profils de boss détaillés conservent les séquences et phases dans l'ordre de la source, y compris les remises à Phase 1 entre rencontres. 80 pages ont été collectées dans ce lot (157 séquences). Les autres niveaux affichent leurs effets connus et signalent les phases manquantes. Les statistiques sont des valeurs de fiche, pas des dégâts reçus calculés.

Les sources de médailles sont issues de récompenses identifiées avec image de médaille, et d'une correspondance complète du nom incluant son grade ; 485 fiches disposent d'au moins une association. Les drops, probabilités et premières victoires ne sont pas inférés. Rebuild : `python tools/build_progress_data.py`. Boss : `python tools/collect_boss_profiles.py 80` (sans limite pour toutes les pages).

La synchronisation dispose d'un client Supabase, d'une connexion par code, d'une sauvegarde privée et de conflits de révision. Elle n'est pas activée en production sans service configuré. Voir `docs/synchronisation.md` et `backend/supabase.sql`. Les tests de connexion utilisent un service simulé ; un service de production reste à tester après raccordement.

Toutes les données personnelles ajoutées sont incluses dans la sauvegarde complète ; la configuration de synchronisation, les sessions et la copie de secours sont exclues. Tests : `node tools/test_progression.cjs`, `node tools/audit_progression_browser.cjs` avec Playwright et serveur HTTP local.
