let sendValidationErrorResponse = function (message, res) {
    return res
        .status(500)
        .send({
            status: "failure",
            status_code: 500,
            message:message
        });
};

let sendErrorResponse = function (err, res) {
    return res
        .status(err.status_code || 500)
        .send({
            status: "failure",
            status_code: err.status_code || 500,
            message: err.message,
            error_description: err.error_description || "",
            data: err.data || {},
        });
};

let sendSuccessResponse = function (result, res, other) {
    let sendData = {
        status: "success",
        status_code: result.status_code || 200,
        message: result.message || "SUCCESS!",
        data: result.data || {},
    };
    sendData = { ...sendData, ...other };
    return res.status(result.status_code || 200).send(sendData);
};
let sendSuccessResponseWithCount = function (result, count, res, other) {
    let sendData = {
        status: "success",
        status_code: result.status_code || 200,
        message: __(result.message) || "SUCCESS!",
        data: result.data || {},
        totalCount: count,
    };
    sendData = { ...sendData, ...other };
    return res.status(result.status_code || 200).send(sendData);
};
const sendValidationResponseFaucet = function (message, res) {
    return res.status(200).send({
      status: "failure",
      status_code: 200,
      message: __(message),
      data:{}
    });
  };
module.exports = {
    sendValidationErrorResponse,
    sendErrorResponse,
    sendSuccessResponseWithCount,
    sendSuccessResponse,
    sendValidationResponseFaucet
};
