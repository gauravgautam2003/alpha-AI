import proxy from "express-http-proxy"

export const proxyWithHeader = (serviceUrl) => {
    return proxy(serviceUrl, {
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            if(srcReq && srcReq.user) {
                proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
                proxyReqOpts.headers["x-user-plan"] = srcReq.user.plan || "free";
            }
            return proxyReqOpts;
        }
    })
}