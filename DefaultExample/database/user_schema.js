const crypto = require('crypto');
const Schema = { };


Schema.createSchema = function(mongoose){
  // 스키마 정의
  const UserSchema = mongoose.Schema({
    id : {type : String, required : true, unique:true, 'default':''},
    hashed_password : {type:String, required:true, 'default':''},
    salt:{type:String, required:true},
    name:{type:String, index:'hashed', 'default':'' },
    age:{type:Number, 'default':-1},
    created_at:{type:Date, index:{unisque:false}, 'default' : Date.now },
    updated_at:{type:Date, index:{unisque:false}, 'default' : Date.now }
  });

  UserSchema
   .virtual('password')
   .set(function(password){
     this._password = password;
     this.salt = this.makeSalt();
     this.hashed_password = this.encryptPassword(password);
     console.log('virtual password 호출됨 : ', this.hashed_password);
   })
   .get(function(){return this._password});

   UserSchema.method('encryptPassword', function(plainText, inSalt){
     if (inSalt) {
       return crypto.createHmac('sha1', inSalt).update(plainText).digest('hex');
     } else {
        return crypto.createHmac('sha1', this.salt).update(plainText).digest('hex');
     }
   });

   //salt 값 만들기 메소드
   UserSchema.method('makeSalt', function(){
     return Math.round((new Date().valueOf() * Math.random())) + '';
   });

   //인증 메소드 입력된 비밀번호와 비교 (true/false 리턴)
   UserSchema.method('authenticate', function(plainText, inSalt, hashed_password){
     if (inSalt) {
       console.log('authenticate 호출됨 : %s -> %s : %s'+plainText+
         this.encryptPassword(plainText, inSalt), hashed_password);
       return this.encryptPassword(plainText, inSalt) === hashed_password;
     } else {
       console.log('authenticate 호출됨 : %s -> %s : %s'+plainText+
         this.encryptPassword(plainText), this.hashed_password);
       return this.encryptPassword(plainText, inSalt) === this.hashed_password;
     }
   });

   // 값이 유효한지 확인하는 함수 정의
	var validatePresenceOf = function(value) {
		return value && value.length;
	};

	// 저장 시의 트리거 함수 정의 (password 필드가 유효하지 않으면 에러 발생)
	UserSchema.pre('save', function(next) {
		if (!this.isNew) return next();

		if (!validatePresenceOf(this.password)) {
			next(new Error('유효하지 않은 password 필드입니다.'));
		} else {
			next();
		}
	});


   //필수 속성에 대한 유효성 확인(길이 값 체크)
   UserSchema.path('id').validate(function(id){
     return id.length;
   }, 'id 칼럼의 값이 없습니다.');

   UserSchema.path('name').validate(function(name){
     return name.length;
   }, 'name 칼럼의 값이 없습니다.');

   UserSchema.path('hashed_password').validate(function (hashed_password) {
   return hashed_password.length;
   }, 'hashed_password 칼럼의 값이 없습니다.');

    //
   UserSchema.static('findById', function(id, callback){
     return this.find({id:id}, callback);
   });
   UserSchema.static('findAll', function(callback){
     return this.find({ }, callback);
   });

   console.log('UserSchema 정의함.');
   return UserSchema;

};

// module.exports에 UserSchema 객체 직접 할당
module.exports = Schema;
