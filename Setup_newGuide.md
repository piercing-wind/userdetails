Step 1 
Add ApiVersion paramter in userdetails-parameters-lambdas.json
"ApiVersion": "v1"

after that 

Make changes in the userdetails-lambdas-simple.yaml

Accept ApiVersion parameter in stack. 
on 16 to 19. remember the parameter name should be same "ApiVersion" which we are passing from params to our stack.


Next go to lambda function on lineNo. 85

from line 85 to 103 Events are for api enpoints
add this to create new endpoints

Paths will be as follows
    /${ApiVersion}/${ProjectId}/region
    /${ApiVersion}/${ProjectId}/region/${{id}}
    /${ApiVersion}/${ProjectId}/locality

which will result in 
.amazonaws.com/dev/v1/userdetails/region
.amazonaws.com/dev/v1/userdetails/region/01
.amazonaws.com/dev/v1/userdetails/locality


after that make sure on line 107 or around it 
the dependsOn value should be ApiGatewayApidevStage
an its ApiStages:
        - ApiId: !Ref ApiGatewayApi
          Stage: dev <-- should be dev

and around line 57 to 61
Resources:
  ApiGatewayApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: dev <-- should be dev


<!-- Script -->
stacks/lambdas_nodejs/getCounty

Make sure your index.js follow same structure as the newer one.

next inside the /data folder delete older files and replace it with the
    - getLocality.js
    - getRegion.js

only these two files are required.
