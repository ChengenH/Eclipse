// 配置项
const clickAreaConfig = {
    // X轴配置
    x: {
        offset: 0.3,     // 基准位置（屏幕20%处）
        range: 0.05,     // 随机范围（左右各2.5%）
        jitter: 2        // 像素级随机抖动（±2像素）
    },
    // Y轴配置
    y: {
        center: 0.5,     // 基准位置（屏幕中间）
        range: 0.1,      // 随机范围（上下各5%）
        jitter: 2        // 像素级随机抖动（±2像素）
    }
};

// 时间管理配置
const timeConfig = {
    clickSession: {
        minDuration: 1200,  // 最短持续时间（秒）= 20分钟
        maxDuration: 1800   // 最长持续时间（秒）= 30分钟
    },
    pause: {
        minDuration: 180,   // 最短暂停时间（秒）= 3分钟
        maxDelay: 300       // 最长暂停时间（秒）= 5分钟
    },
    click: {
        minDelay: 170,      // 点击最小间隔（毫秒）(原来800/3≈270)
        maxDelay: 570       // 点击最大间隔（毫秒）(原来2000/3≈670)
    }
};

// 全局状态
let isRunning = false;
let clickCount = 0;
const maxClicks = 10000;  // 最大点击次数
let activeTimers = [];    // 存储所有活动的定时器ID

// 获取当前时间的格式化字符串
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleString();
}

// 获取随机数
function getRandomDuration(min, max) {
    return Math.floor(min + Math.random() * (max - min));
}

// 计算随机点击位置
function getRandomPosition() {
    const screenWidth = window.innerWidth || document.documentElement.clientWidth;
    const screenHeight = window.innerHeight || document.documentElement.clientHeight;
    
    // 计算X坐标
    const baseX = screenWidth * clickAreaConfig.x.offset;
    const rangeX = screenWidth * clickAreaConfig.x.range;
    const jitterX = (Math.random() - 0.5) * 2 * clickAreaConfig.x.jitter;
    const x = Math.floor(baseX + (Math.random() - 0.5) * rangeX + jitterX);
    
    // 计算Y坐标
    const baseY = screenHeight * clickAreaConfig.y.center;
    const rangeY = screenHeight * clickAreaConfig.y.range;
    const jitterY = (Math.random() - 0.5) * 2 * clickAreaConfig.y.jitter;
    const y = Math.floor(baseY + (Math.random() - 0.5) * rangeY + jitterY);
    
    return {x, y};
}

// 执行点击
function performClick() {
    if (!isRunning || clickCount >= maxClicks) {
        stopClicking();
        return;
    }

    const pos = getRandomPosition();
    
    // 创建鼠标按下事件
    const mouseDownEvent = new MouseEvent('mousedown', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: pos.x,
        clientY: pos.y
    });
    
    // 创建鼠标松开事件
    const mouseUpEvent = new MouseEvent('mouseup', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: pos.x,
        clientY: pos.y
    });
    
    // 创建点击事件
    const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: pos.x,
        clientY: pos.y
    });
    
    const element = document.elementFromPoint(pos.x, pos.y);
    if (element) {
        element.dispatchEvent(mouseDownEvent);
        
        let holdDuration;
        const clickType = Math.random();
        if (clickType < 0.2) {
            holdDuration = Math.floor(80 + Math.random() * 20);
        } else if (clickType < 0.9) {
            holdDuration = Math.floor(150 + Math.random() * 100);
        } else {
            holdDuration = Math.floor(200 + Math.random() * 100);
        }
        
        const timerId = setTimeout(() => {
            element.dispatchEvent(mouseUpEvent);
            element.dispatchEvent(clickEvent);
            clickCount++;
            // 定时器执行完后从数组中移除
            const index = activeTimers.indexOf(timerId);
            if (index > -1) {
                activeTimers.splice(index, 1);
            }
        }, holdDuration);
        activeTimers.push(timerId);
    }
}

// 开始点击会话
function startClickSession() {
    const sessionDuration = getRandomDuration(
        timeConfig.clickSession.minDuration,
        timeConfig.clickSession.maxDuration
    ) * 1000; // 转换为毫秒
    
    const startTime = Date.now();
    
    function click() {
        if (!isRunning) return;
        
        const currentTime = Date.now();
        if (currentTime - startTime >= sessionDuration) {
            // 本轮点击结束，进入休息时间
            const pauseDuration = getRandomDuration(
                timeConfig.pause.minDuration,
                timeConfig.pause.maxDelay
            ) * 1000;
            const timerId = setTimeout(() => {
                if (isRunning) {
                    startClickSession();
                }
                // 定时器执行完后从数组中移除
                const index = activeTimers.indexOf(timerId);
                if (index > -1) {
                    activeTimers.splice(index, 1);
                }
            }, pauseDuration);
            activeTimers.push(timerId);
            return;
        }
        
        // 执行点击
        performClick();
        
        // 设置下次点击延迟
        if (isRunning) {
            const nextDelay = getRandomDuration(
                timeConfig.click.minDelay,
                timeConfig.click.maxDelay
            );
            const timerId = setTimeout(click, nextDelay);
            activeTimers.push(timerId);
        }
    }
    
    click(); // 开始点击循环
}

// 开始点击
function startClicking() {
    if (isRunning) {
        console.log('程序已在运行中');
        return;
    }
    activeTimers = []; // 清空定时器数组
    isRunning = true;
    clickCount = 0;
    console.log(`[${getCurrentTime()}] 开始新一轮点击`);
    startClickSession();
}

// 停止点击
function stopClicking() {
    if (!isRunning) {
        console.log('程序已经停止');
        return;
    }
    isRunning = false;
    // 清理所有活动的定时器
    activeTimers.forEach(timerId => {
        clearTimeout(timerId);
    });
    activeTimers = []; // 清空定时器数组
    console.log(`[${getCurrentTime()}] 点击已停止，总点击次数: ${clickCount}`);
}

// 导出控制函数
window.startClicking = startClicking;
window.stopClicking = stopClicking;

// 使用说明
console.log(`
点击控制程序已加载
使用方法：
1. startClicking() - 开始点击
2. stopClicking() - 停止点击

配置说明：
- 点击位置：屏幕左侧20%处，上下5%范围内随机
- 点击间隔：${timeConfig.click.minDelay}-${timeConfig.click.maxDelay}毫秒
- 持续时间：${timeConfig.clickSession.minDuration}-${timeConfig.clickSession.maxDuration}秒
- 休息时间：${timeConfig.pause.minDuration}-${timeConfig.pause.maxDelay}秒
- 最大点击次数：${maxClicks}次
`);
startClicking()
