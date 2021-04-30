sudo apt-get install nodejs awscli &&
pip install -r python/requirements.txt &&
python python/update_questions.py &&
npm install --global yarn && 
cd app && yarn build && cd .. &&
aws s3 sync app/dist s3://ladicteemagique
