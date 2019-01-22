# XLR8 Builder

This service runs inside the XLR8 cluster and, once registered to the internal git repository, will build, push and deploy/update the service
associated to git repositories. 

# Git WebHook

http://xlr8-builder:3000/git-hooks/build-trigger

This internal endpoint has to be registered with the Git organization. 

The builder will look for the xlr8.yaml file in the repository for instructions on how to build and deploy this service. 

