pip install  --ignore-installed -r python/requirements.txt &&
sudo apt-get install nodejs awscli &&
python python/update_questions.py &&
npm install --global yarn && 
cd app && yarn build && cd .. &&
aws s3 sync app/dist s3://ladicteemagique
