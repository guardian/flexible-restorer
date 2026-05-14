# Restorer frontend


## Manually building the app and putting it into the html view the play application uses

`nvm use` (or whatever npm version manager you use)
`npm run build` to compile the client-side code
copy the js file and css file from "/restorer-frontend/dist/assets" to "/public"
rename them to "index.js" and "index.css" (IE remove the versioning tokens)

## TO DO
Modify the vite build config to output the files to the right place so we don't need to do the manual thing above
Write a "dev-start" script to run play and vite together
