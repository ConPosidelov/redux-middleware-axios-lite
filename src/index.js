module.exports = (axios={}, globalParams={}) => (store) => (next) => (action) => {

    if (!action || !action.axios || !action.axios.base) return next(action);
    
    const dispatch = store.dispatch;
    const params = action.axios;
    const basePoint = params.base;

    const axiosInstance = axios[basePoint];
    if (!axiosInstance) return next(action);

    const pointConfig = globalParams[basePoint] || {};

    const entity = params.entity || pointConfig.entity || globalParams.entity || 'entity';
    const url = params.url || pointConfig.url || globalParams.url || '/';
    const method = params.method || pointConfig.method || globalParams.method || 'get';
    const payloadStyle = params.payloadStyle || pointConfig.payloadStyle || globalParams.payloadStyle || 'plain';
    const suffixes = params.suffixes || pointConfig.suffixes || globalParams.suffixes || ['REQUEST',' SUCCESS', 'FAILURE'];

    const defaultReqConfig = {
        url,
        method
    };
    
    const customReqConfig = params.config || {};
    const requestConfig = { ...customReqConfig, ...defaultReqConfig };

    const typeRequest = `${entity.toUpperCase()}_${suffixes[0]}`;
    const typeSuccess = `${entity.toUpperCase()}_${suffixes[1]}`;
    const typeFailure = `${entity.toUpperCase()}_${suffixes[2]}`;

    const isRequest = `${suffixes[0].toLowerCase()}`;
    const isSuccess = `${suffixes[1].toLowerCase()}`;
    const isFailure = `${suffixes[2].toLowerCase()}`;

    const requestAction = params.requestAction;

    if(params.type && params.payload) {
        dispatch(params) 
    } else if(requestAction && requestAction.type && requestAction.payload) {
        dispatch(requestAction)
    } else if(payloadStyle === 'plain') {
        dispatch({
            type: typeRequest,
            payload: {
                status: isRequest
            }
        }) 
    } else if(payloadStyle === 'complex') {
        dispatch({
            type: typeRequest,
            payload: {
                [isRequest]: true,
                [isSuccess]: false,
                [isFailure]: false
            }
        }) 
    }      
   
    const responseHandler = params.onResponse;
    const successHandler = params.onSuccess;
    const isAnyResponseHendlers = successHandler || responseHandler || false;
    const failureHandler = params.onFailure;

    const successAction = params.successAction;
    let validSuccessAction = false;
    if(successAction && successAction.type && successAction.payload && typeof successAction.payload === 'object') validSuccessAction = true;

    const failureAction = params.failureAction;
    let validFailureAction = false;
    if(failureAction && failureAction.type && failureAction.payload && typeof failureAction.payload === 'object') validFailureAction = true;
    
    axiosInstance(requestConfig)
        .then((response) => {
            if(responseHandler) dispatch(responseHandler(response));
            if(successHandler && !responseHandler) dispatch(successHandler(response.data));

            if(validSuccessAction && !isAnyResponseHendlers) {
                if(typeof successAction.payload === 'object'){
                   successAction.payload = { ...successAction.payload, 'data': response.data };
                   dispatch(successAction) 
                } else {
                   console.log('The payload fild must be object') 
                }
            } else if(!isAnyResponseHendlers && payloadStyle === 'plain') {
                dispatch({
                    type: typeSuccess,
                    payload: {
                        status: isSuccess,
                        data: response.data
                    }
                });
            } else if(!isAnyResponseHendlers && payloadStyle === 'complex') {
                dispatch({
                    type: typeSuccess,
                    payload: {
                        [isRequest]: false,
                        [isSuccess]: true,
                        [isFailure]: false,
                        data: response.data
                    }
                });
            }
        })
        .catch( error => {
            if(failureHandler) dispatch(failureHandler(error));
            if(validFailureAction && !failureHandler) {
                if(typeof failureAction.payload === 'object'){
                   failureAction.payload = { ...failureAction.payload, 'error': error };
                   dispatch(failureAction) 
                } else {
                   console.log('The payload fild must be object') 
                }
            } else if(!failureHandler &&  payloadStyle === 'plain') {
                dispatch({
                    type: typeFailure,
                    payload: {
                        status: isFailure,
                        error: error
                    }
                });
            } else if(!failureHandler &&  payloadStyle === 'complex') {
                dispatch({
                    type: typeFailure,
                    payload: {
                        [isRequest]: false,
                        [isSuccess]: false,
                        [isFailure]: true,
                        error: error
                    }
                });
            } 
        });
 
}

  