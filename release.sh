#!/bin/bash
ZIP_NAME=transcribe-notes.zip
zip -r $ZIP_NAME * --exclude $ZIP_NAME

aws lambda update-function-code --function-name transcribe-notes --zip-file fileb://$ZIP_NAME

