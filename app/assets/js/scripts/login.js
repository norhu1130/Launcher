/**
 * Script for login.ejs
 */

const { checkServerIdentity } = require('tls')

// Validation Regexes.
const validUsername         = /^[a-zA-Z0-9_]{1,16}$/
const basicEmail            = /^\S+@\S+\.\S+$/
//const validEmail          = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

// Login Elements
const loginCancelContainer  = document.getElementById('loginCancelContainer')
const loginCancelButton     = document.getElementById('loginCancelButton')
const loginEmailError       = document.getElementById('loginEmailError')
const loginUsername         = document.getElementById('loginUsername')
const loginPasswordError    = document.getElementById('loginPasswordError')
const loginPassword         = document.getElementById('loginPassword')
const checkmarkContainer    = document.getElementById('checkmarkContainer')
const loginRememberOption   = document.getElementById('loginRememberOption')
const loginButton           = document.getElementById('loginButton')
const loginForm             = document.getElementById('loginForm')
const loginMSButton         = document.getElementById('loginMSButton')

const loggerAlt= LoggerUtil('%c[Alt System]', 'color: #000668; font-weight: bold')
// Control variables.
let lu = false, lp = false

const loggerLogin = LoggerUtil('%c[Login]', 'color: #000668; font-weight: bold')


/**
 * Show a login error.
 * 
 * @param {HTMLElement} element The element on which to display the error.
 * @param {string} value The error text.
 */
function showError(element, value){
    element.innerHTML = value
    element.style.opacity = 1
}

/**
 * Shake a login error to add emphasis.
 * 
 * @param {HTMLElement} element The element to shake.
 */
function shakeError(element){
    if(element.style.opacity == 1){
        element.classList.remove('shake')
        void element.offsetWidth
        element.classList.add('shake')
    }
}

/**
 * Validate that an email field is neither empty nor invalid.
 * 
 * @param {string} value The email value.
 */
function validateEmail(value){
    if(value){
        if(!basicEmail.test(value) && !validUsername.test(value)){
            showError(loginEmailError, Lang.queryJS('login.error.invalidValue'))
            loginDisabled(true)
            lu = false
        } else {
            loginEmailError.style.opacity = 0
            lu = true
            if(lp){
                loginDisabled(false)
            }
        }
    } else {
        lu = false
        showError(loginEmailError, Lang.queryJS('login.error.requiredValue'))
        loginDisabled(true)
    }
}

/**
 * Validate that the password field is not empty.
 * 
 * @param {string} value The password value.
 */
function validatePassword(value){
    if(value){
        loginPasswordError.style.opacity = 0
        lp = true
        if(lu){
            loginDisabled(false)
        }
    } else {
        lp = false
        showError(loginPasswordError, Lang.queryJS('login.error.invalidValue'))
        loginDisabled(true)
    }
}

// Emphasize errors with shake when focus is lost.
loginUsername.addEventListener('focusout', (e) => {
    validateEmail(e.target.value)
    shakeError(loginEmailError)
})
loginPassword.addEventListener('focusout', (e) => {
    validatePassword(e.target.value)
    shakeError(loginPasswordError)
})

// Validate input for each field.
loginUsername.addEventListener('input', (e) => {
    validateEmail(e.target.value)
})
loginPassword.addEventListener('input', (e) => {
    validatePassword(e.target.value)
})

/**
 * Enable or disable the login button.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
function loginDisabled(v){
    if(loginButton.disabled !== v){
        loginButton.disabled = v
    }
}

/**
 * Enable or disable loading elements.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
function loginLoading(v){
    if(v){
        loginButton.setAttribute('loading', v)
        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.login'), Lang.queryJS('login.loggingIn'))
    } else {
        loginButton.removeAttribute('loading')
        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.loggingIn'), Lang.queryJS('login.login'))
    }
}

/**
 * Enable or disable login form.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
function formDisabled(v){
    loginDisabled(v)
    loginCancelButton.disabled = v
    loginUsername.disabled = v
    loginPassword.disabled = v
    if(v){
        checkmarkContainer.setAttribute('disabled', v)
    } else {
        checkmarkContainer.removeAttribute('disabled')
    }
    loginRememberOption.disabled = v
}

/**
 * Parses an error and returns a user-friendly title and description
 * for our error overlay.
 * 
 * @param {Error | {cause: string, error: string, errorMessage: string}} err A Node.js
 * error or Mojang error response.
 */
function resolveError(err){
    // Mojang Response => err.cause | err.error | err.errorMessage
    // Node error => err.code | err.message
    if(err.cause != null && err.cause === 'UserMigratedException') {
        return {
            title: Lang.queryJS('login.error.userMigrated.title'),
            desc: Lang.queryJS('login.error.userMigrated.desc')
        }
    } else {
        if(err.error != null){
            if(err.error === 'ForbiddenOperationException'){
                if(err.errorMessage != null){
                    if(err.errorMessage === 'Invalid credentials. Invalid username or password.'){
                        return {
                            title: Lang.queryJS('login.error.invalidCredentials.title'),
                            desc: Lang.queryJS('login.error.invalidCredentials.desc')
                        }
                    } else if(err.errorMessage === 'Invalid credentials.'){
                        return {
                            title: Lang.queryJS('login.error.rateLimit.title'),
                            desc: Lang.queryJS('login.error.rateLimit.desc')
                        }
                    }
                }
            }
        } else {
            // Request errors (from Node).
            if(err.code != null){
                if(err.code === 'ENOENT'){
                    // No Internet.
                    return {
                        title: Lang.queryJS('login.error.noInternet.title'),
                        desc: Lang.queryJS('login.error.noInternet.desc')
                    }
                } else if(err.code === 'ENOTFOUND'){
                    // Could not reach server.
                    return {
                        title: Lang.queryJS('login.error.authDown.title'),
                        desc: Lang.queryJS('login.error.authDown.desc')
                    }
                }
            }
        }
    }
    if(err.message != null){
        if(err.message === 'NotPaidAccount'){
            return {
                title: Lang.queryJS('login.error.notPaid.title'),
                desc: Lang.queryJS('login.error.notPaid.desc')
            }
        } else {
            // Unknown error with request.
            return {
                title: Lang.queryJS('login.error.unknown.title'),
                desc: err.message
            }
        }
    } else {
        // Unknown Mojang error.
        return {
            title: err.error,
            desc: err.errorMessage
        }
    }
}

let loginViewOnSuccess = VIEWS.landing
let loginViewOnCancel = VIEWS.settings
let loginViewCancelHandler

function loginCancelEnabled(val){
    if(val){
        $(loginCancelContainer).show()
    } else {
        $(loginCancelContainer).hide()
    }
}

loginCancelButton.onclick = (e) => {
    switchView(getCurrentView(), loginViewOnCancel, 500, 500, () => {
        loginUsername.value = ''
        loginPassword.value = ''
        loginCancelEnabled(false)
        if(loginViewCancelHandler != null){
            loginViewCancelHandler()
            loginViewCancelHandler = null
        }
    })
}
function checker() {
    var dns = require('dns');
    dns.lookup('authserver.mojang.com', function onLookup(err, addresses, family) {
        var addresses = addresses
        //console.log('addresses:', addresses);
        if (addresses == '13.225.107.68') {
            //console.log("OK")
            global.server = true
        }
        if (addresses == '54.230.166.69')
        {
            //console.log("OK")
            global.server = true
        }
        if (addresses == '99.86.203.68') {
            //console.log("OK")
            global.server = true
        }
    });
}
// Disable default form behavior.
loginForm.onsubmit = () => { return false }

// Bind login button behavior.
loginButton.addEventListener('click', () => {
            // Disable form.
            formDisabled(true)

            // Show loading stuff.
            loginLoading(true)
            var cache_ld = global.server
            if (cache_ld == false) {
                loggerAlt.log("본 사용자는 알트로 감지되었습니다.")
                loginLoading(false)
                setOverlayContent("알트 감지!!", "로그인 서버가 변조되었습니다.<br><br>관리자에게 문의해주세요.", Lang.queryJS('login.tryAgain'))
                setOverlayHandler(() => {
                    formDisabled(false)
                    toggleOverlay(false)
                })
                toggleOverlay(true)
                return false
            }
            AuthManager.addAccount(loginUsername.value, loginPassword.value).then((value) => {
                updateSelectedAccount(value)
                loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.loggingIn'), Lang.queryJS('login.success'))
                $('.circle-loader').toggleClass('load-complete')
                $('.checkmark').toggle()
                setTimeout(() => {
                    switchView(VIEWS.login, loginViewOnSuccess, 500, 500, () => {
                        // Temporary workaround
                        if(loginViewOnSuccess === VIEWS.settings){
                            prepareSettings()
                        }
                        loginViewOnSuccess = VIEWS.landing // Reset this for good measure.
                        loginCancelEnabled(false) // Reset this for good measure.
                        loginViewCancelHandler = null // Reset this for good measure.
                        loginUsername.value = ''
                        loginPassword.value = ''
                        $('.circle-loader').toggleClass('load-complete')
                        $('.checkmark').toggle()
                        loginLoading(false)
                        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.success'), Lang.queryJS('login.login'))
                        formDisabled(false)
                    })
                }, 1000)
            }).catch((err) => {
                loginLoading(false)
                const errF = resolveError(err)
                setOverlayContent(errF.title, errF.desc, Lang.queryJS('login.tryAgain'))
                setOverlayHandler(() => {
                    formDisabled(false)
                    toggleOverlay(false)
                })
                toggleOverlay(true)
                loggerLogin.log('Error while logging in.', err)
            })
})

// 여기부터 Chu Hyeon-jin <choo51455145@gmail.com>의 코드를 기반으로 작성되었습니다.

loginMSButton.addEventListener('click', (event) => {
    ipcRenderer.send('openMSALoginWindow', 'open')
}) 

ipcRenderer.on('MSALoginWindowReply', (event, ...args) => {
    if (args[0] === 'error') {
        
        loginMSButton.disabled = false
        loginLoading(false)
        switch (args[1]){
            case 'AlreadyOpenException': {
                setOverlayContent('오류', '이미 창이 열려있습니다', '확인')
                setOverlayHandler(() => {
                    toggleOverlay(false)
                    toggleOverlay(false, false, 'msOverlay')
                })
                toggleOverlay(true)
                return
            }
            case 'AuthNotFinished': {
                setOverlayContent('ERROR', '수성 런처를 사용하려면 로그인 프로세스를 완료해야 합니다. 성공적으로 로그인하면 창이 저절로 닫힙니다.', '확인')
                setOverlayHandler(() => {
                    toggleOverlay(false)
                    toggleOverlay(false, false, 'msOverlay')
                })
                toggleOverlay(true)
                return
            }
        }
        
    }
    toggleOverlay(false, false, 'msOverlay')
    const queryMap = args[0]
    if (queryMap.has('error')) {
        let error = queryMap.get('error')
        let errorDesc = queryMap.get('error_description')
        if(error === 'access_denied'){
            error = 'ERRPR'
            errorDesc = '필요한 권한을 승인받지 못했습니다.'
        }        
        setOverlayContent(error, errorDesc, 'OK')
        setOverlayHandler(() => {
            loginMSButton.disabled = false
            toggleOverlay(false)
        })
        toggleOverlay(true)
        return
    }

    // Disable form.
    formDisabled(true)

    const authCode = queryMap.get('code')
    AuthManager.addMSAccount(authCode).then(account => {
        updateSelectedAccount(account)
        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.loggingIn'), Lang.queryJS('login.success'))
        $('.circle-loader').toggleClass('load-complete')
        $('.checkmark').toggle()
        setTimeout(() => {
            switchView(VIEWS.login, loginViewOnSuccess, 500, 500, () => {
                // Temporary workaround
                if (loginViewOnSuccess === VIEWS.settings) {
                    prepareSettings()
                }
                loginViewOnSuccess = VIEWS.landing // Reset this for good measure.
                loginCancelEnabled(false) // Reset this for good measure.
                loginViewCancelHandler = null // Reset this for good measure.
                loginUsername.value = ''
                loginPassword.value = ''
                $('.circle-loader').toggleClass('load-complete')
                $('.checkmark').toggle()
                loginLoading(false)
                loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.success'), Lang.queryJS('login.login'))
                formDisabled(false)
            })
        }, 1000)
    }).catch(error => {
        loginMSButton.disabled = false
        loginLoading(false)
        setOverlayContent('오류!', error.message ? error.message : '마이크로 소프트 로그인중 오류가 발생했습니다.', Lang.queryJS('login.tryAgain'))
        setOverlayHandler(() => {
            formDisabled(false)
            toggleOverlay(false)
        })
        toggleOverlay(true)
        loggerLogin.error(error)
    })
})