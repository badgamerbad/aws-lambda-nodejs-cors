# AWS Lambda Function (API) with CORS enabled for IngredoFit Application

This serves the api for the ingredofit app for authorization and safekeeping of sercret keys.

# GCP

## Install `gsutil` and Login into project in CLI
[here](https://cloud.google.com/storage/docs/gsutil_install)

```
$ gsutil init
# select Re-initialize this configuration
# login - Yes

# select the project (ingredofit)
```

## CORS
To set cors on GCP buckets [See this.](https://cloud.google.com/storage/docs/configuring-cors)

```
$ gsutil cors get gs://ingredofit.appspot.com

$ gsutil cors set gcp-ingredofir-cors.json gs://ingredofit.appspot.com
```

# AES GCM
Example on [github](https://gist.github.com/AndiDittrich/4629e7db04819244e843)
