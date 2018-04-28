# redux-middleware-axios-lite

A middleware for redux. It simplifies to manage actions when we works with rest API.
It's similar to **redux-axios-middleware** but has some own options.

## Installation

```bash
npm install redux-middleware-axios-lite
```
and you need
```bash
npm install axios
```

## Bind middleware

```javascript
import {createStore, applyMiddleware} from 'redux';
import axios from 'axios';
import axiosLite from 'redux-middleware-axios-lite';

// Now you can specify multiple HTTP endpoints and set each
// own default parametrs - see details [](https://github.com/axios/axios#creating-an-instance)

const pointOne = axios.create({
    baseURL: 'https://some-domain-one.com/api/'
    // there may be many more options
});
const pointTwo = axios.create({
    baseURL: 'https://some-domain-two.com/api/'
});
const pointThree = axios.create({
    baseURL: 'https://some-domain-three.com/api/'
});

// We will transfer these endpoints to the configuration object 

const endPoints = {
    pointOne,
    pointTwo,
    pointThree
}

// and connect it to Redux

const store = createStore (
    rootReducer, 
    applyMiddleware( … ,axiosLite(endPoints), ... )
);
```

Optional (but not required !!!) you can connect middllware config
It will change the default settings common for all endpoints
or for each point separately, specifying the properties of the configuration object
with the name of the desired point.

5 settings are possible: `suffixes`, `payloadStyle`, `entity`, `url`, and `method` 
(their meaning and meanings are explained below).
For example

```javascript
const  axiosLiteConfig = {
    // globally for all endpoints
    payloadStyle: “complex”,
    suffixes: [ SENT, RECEVED, PROBLEMS],
    //for point with name - pointTwo
    pointTwo: {
        payloadStyle: “plain”, 
        method: “post”
    }
}
// then it can be passed by the second arguments of the middleware

const store = createStore (
    rootReducer, 
    applyMiddleware( … , axiosLite(endPoints, axiosLiteConfig), ... )
);
```


##Usage

For the start of middlywars, you only need a couple of things:
    1. Action must include the `axios` parameter whose value is the object
    2. One of the endpoints connected in the configuration the `base` parameter
     of the `axios` object is used for this
All other parameters are optional and can be defined as necessary
or taken of their default values ( see ……..)
The shortest valid example can be:

```javascript
dispatch ({
    axios: {
        base: 'endPointName'
    }
})
```

###1. Managing the creation of actions

Middelware has three ways of creating actions.
Automatic, semi-automatic and manual.
They can be used separately from each other or in any combination.

####The first way:
    automatic generation and dispatch an actions

    To do this, use:
        parameter entity (name of the entity) on the basis of which the prefixes are formed in action.type and action.payload

        A real simple example:

```javascript
// getPost - ordinary action creater

const getPost = ( id ) => {
    return {
         axios: {
            base: 'pointOne',     //gives a config point 
            entity: 'post',       // gives the prefixes in action.type & action.payload 
            url: `posts/${ id }`
        }
    }
};

dispatch( getPost( 2 ));
```

In this example, the request will be sent to `https://some-domain-one.com/api/posts/2`
As a result, the following actions will be dispatched:

before the request:
```javascript
{ 
    type: 'POST_REQUEST' , 
    payload: { 
        status: 'request'
    } 
}
// POST - formed from the param entity
// REQUEST & request are formed from the default param suffixes [0]
```

in case of success:
```javascript
{  
    type: 'POST_SUCCESS' ,
    payload: { 
        status: 'success' ,
        data:  response.data // data received from the server
    }
}
```

in case of failure:
```javascript
{  
    type: 'POST_FAILURE' ,
    payload: { 
        status: 'failure' ,
        error: error //  data received from the server
    }
}
```

If you need a extended payload style, just add the `payloadStyle: complex`

```javascript
...
axios: {
    payloadStyle: 'complex',
    base: 'pointOne',
    entity: 'post',
    url: `posts/${ id }`
}
...
```

You will receive actions in this form:
```javascript
{ 
    type: 'POST_REQUEST' ,
    payload: { 
        request: true,
        success: false,
        failure: false
    }
}
```

You can also change the default suffixes by adding the `suffixes` parameter, for example:
```javascript
...
axios: {
    suffixes: ['FETCHING', 'FETCHED', 'FAILED'],
    payloadStyle: 'complex',
    base: 'pointOne',
    entity: 'post',
    url: `posts/${ id }`
}
...
```

This will change the type and payload in actions, thus:
```javascript
{ 
    type: 'POST_FETCHING' ,
    payload: { 
        fetching: true,
        fetched: false,
        failed: false
    }
}
```


###The second way:
    semi-automatic generation and dispatch an actions

    To do this, you must specify the parameters `requestAction`, `successAction`, `failureAction`, 
    or any of them

```javascript
...
axios: {
    base: 'pointOne',
    url: `posts/${ id }`,
    requestAction: {
        type: 'POST_FETCHING',
        payload: {status: 'isFetching' }
    },
    successAction: {
        type: 'POST_FETCHED',
        payload: {status: 'isFetched'}
    },
    failureAction: {
        type: 'POST_FETCH_FAILURE',
        payload: { status: 'isFetchFailure'}
    }
}
```  

When actions are dispatch, the `requestAction`  will remain unchanged.
And `successAction` and `failureAction` will automatically receive additions 
to the payload field

for successAction :
```javascript
{
    type: 'POST_FETCHED',
    payload: { 
        status: 'isFetched',
        data:  response.data     // data received from the server
    }
}
```

for failureAction :
```javascript
{
    type: 'POST_FETCH_FAILURE',
    payload: { 
        status: 'isFetchFailure',
        error: error             // data received from the server
    }
}
```

**Caution:** for correct operation of the semi-automatic mode the `payload` field must be an object type

Instead of the `requestAction` parameter, you can directly specify  the `type` and `payload` :
```javascript
...
axios: {
    base: 'pointOne',
    url: `posts/${ id }`,
    type: 'POST_FETCHING',
    payload: { status: 'isFetching'}
    ...
}
```

This will take precedence if you specify the `requestAction` parameter at the same time


###The third way:
    to create actions is to use your own handlers to generate actions

    The following parameters are possible that get their handlers:

    `onResponse` - will receive the response object as an argument
    `onSuccess` - will receive the response.data object as its argument
    `onFailure` - will receive the error object as an argument

For example:
```javascript
...
const postSuccessHandler = ({ id, title, body }) => {
    return {
        type: 'POST_SUCCESS' ,
        payload: { 
            status: 'success' ,
            id,
            title,
            body
        }
    }
};

const getPost = (id) => {
    return {
        axios: {
            base: 'pointOne',
            entity: 'post',
            url: `posts/${id}`,
            onSuccess: postSuccessHandler,
            failureAction: {
                type: 'POST_FETCH_FAILURE',
                payload: { 
                    post: 'isFetchFailure'
                }
            }
        }
    }
};

```

In this example:
    Request action will be generated automatically by default values 
    and values from the `entity` parameter.
    Success action will be generated using your own `postSuccessHandler`.
    Failure action will be generated using the `failureAction` parameter 
    in the semi-automatic mode.

Priority of the operations of creating actions:
    Highest:
        for request Action - direct instruction `type` and `payload` params
        for success Action - success handler with `onSuccess` papam  
        for failure Action - failure handler with `onFailure` papam
    Then:
        for All - `requestAction`, `successAction` and `failureAction` params
    Then:
        automatically generate action



##Query Management

There are only two values from the query object that can be specified separately.
This parameter is `url` - (default value is "/") and `method` - (default value "get").
The rest can be changed by using the `config` parameter.

```javascript
...
const sendPost = ( userId, data ) => {
    return {
        axios: {
            base: 'urlTwo',
            entity: 'sendPost',
            url: `user/${ userId }`,
            method: 'post',
            config: {
                data
            }
        }
    }
};
```

If the `url` and `method` parameters are specified outside the `config` object (as in this example),
they will overwrite the corresponding parameters inside the `config` object.

##API

**Options:**

    Priority of the set options:
        Highest:
            directly instruction in axios object
        Then:
            instruction in point config (params in pointName obj in axiosLiteConfig)
        Then:
            instruction in axiosLiteConfig 
        Then:
            default values

| NAME          |   TYPE   |  VALUES   |   DEFAULT VAL                 |   DESCRIPTION                 |   
| ------------- | -------- | --------- | ----------------------------- | ----------------------------- |
| url           | string   |           |  '/'                          | add to baseURL param          |   
| method        | string   |           |     'get'                     |    HTTP metod                 |
| entity        | string   |     any   |    'entity'                   |    prefix to action types     | 
| payloadStyle  | string   |'plain','complex'|   'plain'               | define action.payload style   |
| suffixes      |  array   |    any    |[REQUEST','SUCCESS','FAILURE'] | suffixes to action types      |
                |           |              |                               |                            
requestAction   |  object   |    any       |                               | define action before HTTP request  
                |           |              |                               |                                   
successAction   |  object   |    any       |                               | define action after successful HTTP request
                |           |              |                               |                                  
failureAction   |  object   |    any       |                               | define action after failed HTTP request
                |           |              |                               |                                              
onSuccess       | function  |    any       |                               | custom handler after successful HTTP request
                |           |              |                               | takes as an argument **respons.data** object
                |           |              |                               |                                                   
onResponse      | function  |    any       |                               | custom handler after successful HTTP request
                |           |              |                               | takes as an argument **respons** object
                |           |              |                               |                                              
onFailure       | function  |    any       |                               | custom handler after failed HTTP request
                |           |              |                               | takes as an argument **error** object
                |           |              |                               |                                             











