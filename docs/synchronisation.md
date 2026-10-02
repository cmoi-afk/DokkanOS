# Synchronisation privée optionnelle

La version GitHub Pages fonctionne sans serveur. La connexion Supabase est implémentée mais **aucun service n'est configuré dans la version publiée**. La Box reste locale tant que le service n'est pas activé. Aucun compte ni abonnement n'a été créé par cette mise à jour.

## Activation
1. Créer un projet Supabase et exécuter `backend/supabase.sql` dans son SQL Editor.
2. Activer l'authentification par e-mail et un envoi SMTP adapté au nombre d'utilisateurs. Dans le modèle Magic Link, afficher `{{ .Token }}` pour envoyer un code. Configurer l'URL du site `https://cmoi-afk.github.io/DokkanOS/`.
3. Dans Copilote → Synchronisation, renseigner l'URL du projet et uniquement sa clé publique `anon` ou `sb_publishable_`. Ne jamais fournir de clé secrète/service_role. Se connecter avec le code reçu.
4. Choisir la version de départ. Sur le deuxième appareil, se connecter au même projet et compte puis charger la sauvegarde en ligne. Activer la synchronisation automatique sur chaque appareil.

La fonction de sauvegarde utilise une révision attendue : deux écritures concurrentes ne s'écrasent pas silencieusement. La politique RLS limite chaque compte à sa ligne. Les sauvegardes passent par HTTPS ; aucun chiffrement de bout en bout n'est revendiqué. L'administrateur du projet a accès aux données.

Les sessions restent dans sessionStorage, hors sauvegardes. Au retour dans l'app et toutes les 30 secondes pendant son utilisation, la synchronisation examine les modifications. Une modification distante seule est restaurée puis l'app se recharge ; une copie de secours est conservée localement. Des changements sur les deux appareils ouvrent un choix explicite avec export de chaque version. Hors ligne, les données restent locales et seront réexaminées au retour du réseau.

Vérification effectuée avec un service simulé (connexion, isolation des secrets hors export, conflit de révision, sauvegarde et restauration), pas avec un projet de production. Après configuration, tester avec deux comptes distincts et deux appareils avant d'utiliser le service comme sauvegarde principale.

Sources de l'API : https://supabase.com/docs/guides/auth/auth-email-passwordless ; https://github.com/supabase/auth/blob/master/openapi.yaml ; https://supabase.com/docs/guides/database/postgres/row-level-security
