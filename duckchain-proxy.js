const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const readline = require('readline');
const { HttpsProxyAgent } = require('https-proxy-agent');

class DuckChainAPIClient {
    constructor() {
        this.headers = {
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
            "Origin": "https://tgdapp.duckchain.io",
            "Referer": "https://tgdapp.duckchain.io/",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
        };
        this.proxies = [];
    }

    async loadProxies() {
        try {
            const proxyFile = path.join(__dirname, 'proxy.txt');
            this.proxies = fs.readFileSync(proxyFile, 'utf8')
                .replace(/\r/g, '')
                .split('\n')
                .filter(Boolean);
            this.log(`Đã tải ${this.proxies.length} proxy từ file`, 'success');
        } catch (error) {
            this.log(`Không thể đọc file proxy: ${error.message}`, 'error');
            this.proxies = [];
        }
    }

    async checkProxyIP(proxy) {
        try {
            const proxyAgent = new HttpsProxyAgent(proxy);
            const response = await axios.get('https://api.ipify.org?format=json', {
                httpsAgent: proxyAgent,
                timeout: 10000
            });
            if (response.status === 200) {
                return response.data.ip;
            } else {
                throw new Error(`Không thể kiểm tra IP của proxy. Status code: ${response.status}`);
            }
        } catch (error) {
            throw new Error(`Error khi kiểm tra IP của proxy: ${error.message}`);
        }
    }

    createAxiosInstance(proxyUrl) {
        return axios.create({
            headers: this.headers,
            httpsAgent: proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined,
            timeout: 30000
        });
    }

    log(msg, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        switch(type) {
            case 'success':
                console.log(`[${timestamp}] [✓] ${msg}`.green);
                break;
            case 'custom':
                console.log(`[${timestamp}] [*] ${msg}`.magenta);
                break;        
            case 'error':
                console.log(`[${timestamp}] [✗] ${msg}`.red);
                break;
            case 'warning':
                console.log(`[${timestamp}] [!] ${msg}`.yellow);
                break;
            default:
                console.log(`[${timestamp}] [ℹ] ${msg}`.blue);
        }
    }

    async countdown(seconds) {
        for (let i = seconds; i > 0; i--) {
            const timestamp = new Date().toLocaleTimeString();
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`[${timestamp}] [*] Chờ ${i} giây để tiếp tục...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout, 0);
    }

    async getUserInfo(authorization, proxyUrl) {
        try {
            const axiosInstance = this.createAxiosInstance(proxyUrl);
            const response = await axiosInstance.get('https://preapi.duckchain.io/user/info', {
                headers: {
                    ...this.headers,
                    'Authorization': `tma ${authorization}`
                }
            });

            if (response.data.code === 200) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async setDuckName(authorization, duckName, proxyUrl) {
        try {
            const axiosInstance = this.createAxiosInstance(proxyUrl);
            const encodedDuckName = encodeURIComponent(duckName);
            const response = await axiosInstance.get(`https://preapi.duckchain.io/user/set_duck_name?duckName=${encodedDuckName}`, {
                headers: {
                    ...this.headers,
                    'Authorization': authorization
                }
            });

            if (response.data.code === 200) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getTaskList(authorization, proxyUrl) {
        try {
            const axiosInstance = this.createAxiosInstance(proxyUrl);
            const response = await axiosInstance.get('https://preapi.duckchain.io/task/task_list', {
                headers: {
                    ...this.headers,
                    'Authorization': `tma ${authorization}`
                }
            });
    
            if (response.data.code === 200) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async getTaskInfo(authorization, proxyUrl) {
        try {
            const axiosInstance = this.createAxiosInstance(proxyUrl);
            const response = await axiosInstance.get('https://preapi.duckchain.io/task/task_info', {
                headers: {
                    ...this.headers,
                    'Authorization': `tma ${authorization}`
                }
            });
    
            if (response.data.code === 200) {
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async performDailyCheckIn(authorization, proxyUrl) {
        try {
            const axiosInstance = this.createAxiosInstance(proxyUrl);
            const response = await axiosInstance.get('https://preapi.duckchain.io/task/sign_in', {
                headers: {
                    ...this.headers,
                    'Authorization': `tma ${authorization}`
                }
            });
    
            if (response.data.code === 200) {
                this.log('Điểm danh hàng ngày thành công', 'success');
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async completeTask(authorization, task, proxyUrl) {
        try {
            const axiosInstance = this.createAxiosInstance(proxyUrl);
            const response = await axiosInstance.get(`https://preapi.duckchain.io/task/onetime?taskId=${task.taskId}`, {
                headers: {
                    ...this.headers,
                    'Authorization': `tma ${authorization}`
                }
            });
    
            if (response.data.code === 200) {
                this.log(`Làm nhiệm vụ ${task.content} thành công | Phần thưởng: ${task.integral} DUCK`, 'success');
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async processAllTasks(authorization, proxyUrl) {
        try {
            const taskInfo = await this.getTaskInfo(authorization, proxyUrl);
            if (!taskInfo.success) {
                this.log(`Không thể lấy thông tin nhiệm vụ: ${taskInfo.error}`, 'error');
                return;
            }
    
            const { daily: completedDaily, oneTime: completedOneTime, partner: completedPartner } = taskInfo.data;
    
            const taskList = await this.getTaskList(authorization, proxyUrl);
            if (!taskList.success) {
                this.log(`Không thể lấy danh sách nhiệm vụ: ${taskList.error}`, 'error');
                return;
            }
    
            const { daily, oneTime, partner, social_media } = taskList.data;
    
            if (daily && Array.isArray(daily)) {
                for (const task of daily) {
                    if (task.taskId === 8 && !completedDaily.includes(8)) {
                        this.log('Đang thực hiện điểm danh hàng ngày...', 'info');
                        await this.performDailyCheckIn(authorization, proxyUrl);
                    }
                }
            }
    
            if (oneTime && Array.isArray(oneTime)) {
                for (const task of oneTime) {
                    if (!completedOneTime.includes(task.taskId)) {
                        this.log(`Đang thực hiện nhiệm vụ: ${task.content}...`, 'info');
                        await this.completeTask(authorization, task, proxyUrl);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }
    
            if (partner && Array.isArray(partner)) {
                for (const task of partner) {
                    if (!completedPartner.includes(task.taskId)) {
                        this.log(`Đang thực hiện nhiệm vụ đối tác: ${task.content}...`, 'info');
                        await this.completeTask(authorization, task, proxyUrl);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }
    
            this.log('Hoàn thành xử lý tất cả nhiệm vụ', 'success');
        } catch (error) {
            this.log(`Lỗi khi xử lý nhiệm vụ: ${error.message}`, 'error');
        }
    }

    async executeQuack(authorization, proxyUrl) {
        try {
            const axiosInstance = this.createAxiosInstance(proxyUrl);
            const response = await axiosInstance.get('https://preapi.duckchain.io/quack/execute', {
                headers: {
                    ...this.headers,
                    'Authorization': `tma ${authorization}`
                }
            });

            if (response.data.code === 200) {
                const { quackRecords, quackTimes, decibel } = response.data.data;
                const totalNegative = quackRecords.reduce((sum, num) => {
                    const value = parseInt(num);
                    return sum + (value < 0 ? value : 0);
                }, 0);

                this.log(`Quack lần ${quackTimes} | Tổng âm: ${totalNegative} | Decibel còn lại: ${decibel}`, 'custom');
                return { success: true, data: response.data.data };
            } else {
                return { success: false, error: response.data.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async processQuacks(authorization, decibels, proxyUrl, maxQuackTimes = 0) {
        this.log(`Bắt đầu quack với ${decibels} decibels...`, 'info');
        let quackCount = 0;
        
        while (decibels > 0 && (maxQuackTimes === 0 || quackCount < maxQuackTimes)) {
            const result = await this.executeQuack(authorization, proxyUrl);
            if (!result.success) {
                this.log(`Lỗi khi quack: ${result.error}`, 'error');
                break;
            }
            decibels = parseInt(result.data.decibel);
            quackCount++;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        this.log('Hoàn thành quack!', 'success');
    }

    askQuestion(query) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        return new Promise(resolve => rl.question(query, ans => {
            rl.close();
            resolve(ans);
        }))
    }

    async main() {
        await this.loadProxies();
        const dataFile = path.join(__dirname, 'data.txt');
        const data = fs.readFileSync(dataFile, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);
    
        this.log('Tool được chia sẻ tại kênh telegram Dân Cày Airdrop (@dancayairdrop)'.green);
        
        const quacktime = await this.askQuestion('Bạn có muốn Quack Times không? (y/n)..Quack Times có thể sẽ bị trừ hết DUCK: ');
        const hoiquacktime = quacktime.toLowerCase() === 'y';
        let maxQuackTimes = 0;
        
        if (hoiquacktime) {
            const quackTimesInput = await this.askQuestion('Bạn muốn Quack Times bao nhiêu lần? (Nhấn Enter để quack đến hết): ');
            maxQuackTimes = quackTimesInput ? parseInt(quackTimesInput) : 0;
        }
    
        while (true) {
            for (let i = 0; i < data.length; i++) {
                const authorization = data[i];
                const userData = JSON.parse(decodeURIComponent(authorization.split('user=')[1].split('&')[0]));
                const firstName = userData.first_name;
                const lastName = userData.last_name || '';
                const fullName = `${firstName} ${lastName}`.trim();
                
                let proxyIP = "No proxy";
                let currentProxy = null;
                
                if (this.proxies[i]) {
                    try {
                        currentProxy = this.proxies[i];
                        proxyIP = await this.checkProxyIP(currentProxy);
                        this.log(`Proxy #${i + 1} hoạt động tốt | IP: ${proxyIP}`, 'success');
                    } catch (error) {
                        this.log(`Lỗi proxy #${i + 1}: ${error.message}`, 'warning');
                        proxyIP = "Proxy Error";
                        continue;
                    }
                }

                console.log(`========== Tài khoản ${i + 1} | ${fullName.green} | ip: ${proxyIP} ==========`);
                
                this.log(`Đang kiểm tra thông tin tài khoản...`, 'info');
                const userInfo = await this.getUserInfo(authorization, currentProxy);
                
                if (userInfo.success) {
                    this.log(`Lấy thông tin thành công!`, 'success');
                    
                    if (userInfo.data.duckName === null) {
                        this.log(`Đang thiết lập tên duck...`, 'info');
                        const setNameResult = await this.setDuckName(authorization, fullName, currentProxy);
                        
                        if (setNameResult.success) {
                            this.log(`Đặt tên duck thành công: ${setNameResult.data.duckName}`, 'success');
                            this.log(`Decibels: ${setNameResult.data.decibels}`, 'custom');
                            if (hoiquacktime && setNameResult.data.decibels > 0) {
                                await this.processQuacks(authorization, setNameResult.data.decibels, currentProxy, maxQuackTimes);
                            }
                            
                        } else {
                            this.log(`Không thể đặt tên duck: ${setNameResult.error}`, 'error');
                        }
                    } else {
                        this.log(`Duck name đã được thiết lập: ${userInfo.data.duckName}`, 'info');
                        if (userInfo.data.decibels) {
                            this.log(`Decibels: ${userInfo.data.decibels}`, 'custom');
    
                            if (hoiquacktime && userInfo.data.decibels > 0) {
                                await this.processQuacks(authorization, userInfo.data.decibels, currentProxy, maxQuackTimes);
                            }
                        }
                    }
                
                    this.log('Đang xử lý nhiệm vụ...', 'info');
                    await this.processAllTasks(authorization, currentProxy);
                } else {
                    this.log(`Không thể lấy thông tin tài khoản: ${userInfo.error}`, 'error');
                }

                await new Promise(resolve => setTimeout(resolve, 2000));
            }
    
            await this.countdown(86400);
        }
    }
}

const client = new DuckChainAPIClient();
client.main().catch(err => {
    client.log(err.message, 'error');
    process.exit(1);
});