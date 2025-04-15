const errorsConstants = {
  inputIdRequired: 'errors.input_Id_required',
  inputRequired: 'errors.input_required',
  invalidDate: 'errors.coaching.invalid_date',
  invalidNumber: 'errors.user.invalid_number',
  serverError: 'errors.server_error',
  unauthorized: 'errors.unauthorized',
  userNotFound: 'errors.user_not_found',
  tokenSucces: 'Inicio de sesión exitoso',
  expiredToken: 'errors.expired_token',
  haventToken: 'errors.havent_token',
  invalidToken: 'errors.invalid_token',
  tokenRequired: 'errors.token_required',
  userNotCreate: 'errors.user_not_create',
  userExist: 'errors.user_exist',
  careerExist: 'Career.already.exists',
  subjectNotExist: 'Subject.not.exists',
  subjectNotUpdate: 'Subject.not.update',
  advisoryNotUpdate: 'Advisory.not.update',
  userUpdated: 'User.updated.successfully',
  userDisabled: 'User.disabled.successfully',
  shortPassword: 'password_is_short',
  schedulesEmpty: 'schedules_is_empty',
  advisoryEmpty: 'Advisory_is_empty',
  passwordIncorrect: 'errors.password_incorrect',
  advisoryNotCreate: 'advisory.Not.Create',
  schedulesNotUpdate: 'schedules.Not.Update',
  openAiError: 'openAi.error',
  userNotEnabled: 'errors.user_not_enabled',
};

module.exports = {
  errorsConstants,
};
