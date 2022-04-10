const validater: any = {
    phone_no: (phone: string) => {
        let regex: RegExp = /^[6-9]\d{9}$/;
        if (phone.match(regex)) {
            return true;
        } else {
            return false;
        }
    }
}

export default validater;