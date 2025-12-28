import { Pan123SDK } from '../../sdk/src';

const config = {
    clientID: '替换成你的',
    clientSecret: '替换成你的',
    debug: true, // 启用debug模式
    /** 调试的时候 这里可以固定一个，避免API请求限制*/
    debugToken: ''
    // 如果要使用测试服务器，请取消注释下面这行
    // baseURL: 'http://localhost:3000'
};

export default new Pan123SDK(config);

