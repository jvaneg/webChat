class User
{
    constructor(name)
    {
        this.name = name;
        this.colour = "#000000";
    }
}

class Message
{
    constructor(user, content)
    {
        this.user = user;
        this.content = content;
        this.timestamp = Date.now();
    }
}

module.exports.User = User;
module.exports.Message = Message;