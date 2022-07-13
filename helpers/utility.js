const emailValidation = (email) => {
    let errFound = true;
    const validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    // console.log({ tag: this.TAG + ' emailvarification', retunofmatach: email.match(validRegex), test: text.match(validRegex) });
    // let emailerr = "please enter valid email address";
    if (email.match(validRegex) != null) {
        // console.log({ tag: this.TAG + ' emailVarification-succseee' });
        // emailerr = ""
        errFound = false
    }
    return errFound
}


let phoneNumberValidation = (text) => {
    const splited = text.split(',')
    const lengthOfSpited = splited.length;
    let errorFound = false;
    // let test = []
    for (let i = 0; i < lengthOfSpited; i++) {
        let str = splited[i];
        if (isNaN(str)) {
            errorFound = true;
            i = lengthOfSpited + 1;
            // test.push('n')
        } else {
            if (str.charAt(0) === '+' || str.charAt(0) >= 0) {
                if (str.length < 15 && str.length > 5) {
                    // test.push('Yes')
                } else {
                    errorFound = true;
                    i = lengthOfSpited + 1;
                    // test.push('no')
                }
            } else {
                errorFound = true;
                i = lengthOfSpited + 1;
                // test.push('no')
            }
        }

    }
    // console.log({ tag: this.TAG + ' phoneNumberValidation', slicedtype: typeof splited, splited, test, errorFound });

    return errorFound
}

module.exports.whatsappParamsValidation = (data) => {
    let errBucket = []
    for (const key in data) {
        if (key == 'name') {
            if (data['name'].length > 0) {
                errBucket.push('pass')
            } else {
                errBucket.push('err')
            }
        } else if (key == 'email_id') {
            let boolien = emailValidation(data['email_id'])
            if (!boolien) {
                errBucket.push('pass')
            } else {
                errBucket.push('err')
            }

        } else if (key == 'roll_number') {
            if (data['roll_number'].length > 0) {
                errBucket.push('pass')
            } else {
                errBucket.push('err')
            }
        } else if (key == 'phone_number') {
            let boolien = phoneNumberValidation(data['phone_number'])
            if (!boolien) {
                errBucket.push('pass')
            } else {
                errBucket.push('err')
            }
        }
    }

    const found = errBucket.find(element => element == 'err');
    const errFound = found ? true : false
    return errFound
}
// name: '',
// email_id: '',
// roll_number: '',
// phone_number: ''