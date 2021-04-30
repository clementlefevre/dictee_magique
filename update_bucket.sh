pip install  --ignore-installed -r python/requirements.txt &&
sudo apt-get install nodejs awscli &&
python python/update_questions.py &&
sudo chown -R $USER /usr/local/lib/node_modules/yarn &&
sudo chown -R $USER /usr/local/lib/node_modules &&
sudo chown -R $USER /usr/local/bin/yarnpkg &&
npm install  yarn && 
cd app && yarn build && cd .. &&
aws s3 sync app/dist s3://ladicteemagique
