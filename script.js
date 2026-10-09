// script.js
import { Rive, Layout, Fit, Alignment } from '@rive-app/canvas';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Rive animation
    const canvas = document.getElementById('riveCanvas');
    let statusInput = null;
    let correctTrigger = null;
    let wrongTrigger = null;

    function updateIllustrationStatus() {
        if (!statusInput) return;
        const passwordInputType = document.getElementById('password').getAttribute('type');
        const activeElement = document.activeElement;
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (passwordInputType === 'text') {
            statusInput.value = 2;
        } else if (activeElement === emailInput || activeElement === passwordInput) {
            statusInput.value = 1;
        } else {
            statusInput.value = 0;
        }
    }

    function validateEmailFormat(email) {
        // 匹配常见的后缀，比如 @qq.com 或 @gmail.com 等，要求顶级域名至少2个字母
        const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    const r = new Rive({
        src: '/riv/illustration.riv', // 使用绝对路径适配 Vite 的 public 目录
        canvas: canvas,
        stateMachines: 'State Machine 1',
        autoplay: true,
        autoBind: true,
        // 使用 Layout 告诉 Rive 引擎如何自适应这个 canvas
        // fit: Fit.Cover 会保证动画内容充满容器，类似 css 的 object-fit: cover
        layout: new Layout({
            fit: Fit.Cover,
            alignment: Alignment.Center,
        }),
        onLoad: () => {
            r.resizeDrawingSurfaceToCanvas();

            // 尝试获取名为 'Login' 的视图模型 (ViewModel)
            const viewModel = r.viewModelByName('Login');
            if (viewModel) {
                const instance = viewModel.defaultInstance();
                r.bindViewModelInstance(instance);
                
                statusInput = instance.number('status');
                correctTrigger = instance.trigger('correct');
                wrongTrigger = instance.trigger('wrong');
            }

            // Fallback: 如果触发器没有在 ViewModel 中获取到，可能是它们作为状态机输入(State Machine Inputs) 存在的
            const inputs = r.stateMachineInputs('State Machine 1');
            if (inputs) {
                if (!statusInput) statusInput = inputs.find(i => i.name === 'status');
                if (!correctTrigger) correctTrigger = inputs.find(i => i.name === 'correct');
                if (!wrongTrigger) wrongTrigger = inputs.find(i => i.name === 'wrong');
            }

            console.log('Rive variables loaded:', {
                status: !!statusInput,
                correct: !!correctTrigger,
                wrong: !!wrongTrigger
            });

            updateIllustrationStatus();
        },
    });

    // Handle window resize to keep canvas sharp
    window.addEventListener('resize', () => {
        if (r) {
            r.resizeDrawingSurfaceToCanvas();
        }
        if (eyeRive) {
            eyeRive.resizeDrawingSurfaceToCanvas();
        }
    });

    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const rememberCheckbox = document.getElementById('remember');

    // 辅助函数：安全地触发 Rive Trigger (兼容 ViewModel 触发器和状态机输入)
    function fireTrigger(t) {
        if (!t) return;
        if (typeof t.trigger === 'function') {
            t.trigger(); // ViewModel 触发器的方法
        } else if (typeof t.fire === 'function') {
            t.fire();    // 状态机输入的触发方法
        }
    }

    // Add listeners for illustration status updates
    emailInput.addEventListener('focus', updateIllustrationStatus);
    
    emailInput.addEventListener('input', () => {
        const email = emailInput.value.trim();
        
        if (validateEmailFormat(email)) {
            // 只要格式正确就触发 correct
            fireTrigger(correctTrigger);
        }
    });

    emailInput.addEventListener('blur', () => {
        updateIllustrationStatus();
    });

    passwordInput.addEventListener('focus', updateIllustrationStatus);
    passwordInput.addEventListener('blur', updateIllustrationStatus);

    // Initialize Eyes Rive animation
    const eyeCanvas = document.getElementById('eyeCanvas');
    let displayInput = null;
    const eyeRive = new Rive({
        src: '/riv/eyes.riv', // 使用绝对路径适配 Vite 的 public 目录
        canvas: eyeCanvas,
        stateMachines: 'State Machine 1', // 保证正常运行状态机
        autoplay: true,
        // 自动绑定默认的视图模型（如果有的话）
        autoBind: true,
        onLoad: () => {
            eyeRive.resizeDrawingSurfaceToCanvas();
            
            // 获取名为 'Eyes' 的视图模型 (ViewModel)
            const viewModel = eyeRive.viewModelByName('Eyes');
            if (viewModel) {
                // 获取视图模型的默认实例并绑定到画板
                const instance = viewModel.defaultInstance();
                eyeRive.bindViewModelInstance(instance);
                
                // 从视图模型实例中获取名为 'display' 的布尔值
                displayInput = instance.boolean('display');
                
                // 初始状态根据密码框类型设置
                // display 值为 true 时，密码是隐藏的 (password)；false 时，密码是显示的 (text)
                if (displayInput) {
                    const type = passwordInput.getAttribute('type');
                    displayInput.value = (type === 'password');
                }
            }
        },
    });
    
    // 监听全局鼠标移动，传递给 eyeCanvas 和 主插画 canvas 以触发 Rive 内部的“跟随触发区域”监听器
    window.addEventListener('mousemove', (e) => {
        // 阻止我们自己派发的合成事件再次触发该监听器，防止无限递归
        if (!e.isTrusted) return;

        if (eyeCanvas) {
            const fakeEventEye = new MouseEvent('mousemove', {
                clientX: e.clientX,
                clientY: e.clientY,
                bubbles: false // 取消冒泡，防止事件循环
            });
            eyeCanvas.dispatchEvent(fakeEventEye);
        }
        
        if (canvas) {
            const fakeEventMain = new MouseEvent('mousemove', {
                clientX: e.clientX,
                clientY: e.clientY,
                bubbles: false 
            });
            canvas.dispatchEvent(fakeEventMain);
        }
    });

    togglePassword.addEventListener('mousedown', function(e) {
        e.preventDefault();
    });
    
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        const length = passwordInput.value.length;
        
        passwordInput.setAttribute('type', type);
        
        // 切换时更新视图模型中的布尔值
        // display 值为 true 时，密码是隐藏的 (password)
        if (displayInput) {
            displayInput.value = (type === 'password');
        }

        // 更新插画的状态机 (如密码显示时 status 变为 2)
        updateIllustrationStatus();
        
        // 保持密码输入框的焦点并强制将光标移到末尾
        passwordInput.focus();
        
        // 使用 setTimeout 确保在 DOM 更新后再设置光标位置
        setTimeout(function() {
            passwordInput.setSelectionRange(length, length);
        }, 0);
    });
    
    // 当密码重新输入时，清除错误状态
    passwordInput.addEventListener('input', function() {
        const passwordGroup = document.getElementById('passwordGroup');
        if (passwordGroup && passwordGroup.classList.contains('error-state')) {
            passwordGroup.classList.remove('error-state', 'shake-animation');
        }
    });

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const isEmailValid = validateEmailFormat(email);
        
        if (!email || !isEmailValid) {
            fireTrigger(wrongTrigger);
            alert('Please enter a valid email (e.g., example@qq.com or example@gmail.com)');
            return;
        }
        
        if (!password) {
            fireTrigger(wrongTrigger);
            alert('Please enter your password');
            return;
        }
        
        // 模拟密码错误交互
        const passwordGroup = document.getElementById('passwordGroup');
        
        // 移除可能存在的动画类，以便能够重新触发
        passwordGroup.classList.remove('shake-animation');
        
        // 强制浏览器重绘 (Reflow)，以重新触发动画
        void passwordGroup.offsetWidth;
        
        // 添加错误状态和晃动动画
        passwordGroup.classList.add('error-state', 'shake-animation');
        
        // 触发插画密码错误状态
        fireTrigger(wrongTrigger);

        // 中断登录流程，模拟一直失败的效果
        return;
        
        if (rememberCheckbox.checked) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('email', email);
        } else {
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('email');
        }
        
        simulateLogin(email);
    });
    
    function simulateLogin(email) {
        const submitBtn = document.querySelector('.btn-primary');
        const originalText = submitBtn.textContent;
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            
            alert(`Welcome back, ${email}!`);
            loginForm.reset();
        }, 1000);
    }
    
    if (localStorage.getItem('rememberMe') === 'true') {
        const savedEmail = localStorage.getItem('email');
        if (savedEmail) {
            emailInput.value = savedEmail;
            rememberCheckbox.checked = true;
        }
    }
});