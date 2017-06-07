const passport = require('passport')
const crypto = require('crypto')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const promisify = require('es6-promisify')

const login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed login!',
  successRedirect: '/',
  successFlash: 'You logged in',
})

const logout = (req, res) => {
  req.logout()
  req.flash('success', 'You are now logged out!')
  res.redirect('/')
}

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next()
    return
  }
  req.flash('error', 'You must be logged in to do that!')
  res.redirect('/login')
}

const forgot = async (req, res) => {
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    req.flash('error', 'No account with that email exists')
    return res.redirect('/login')
  }
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex')
  user.resetPasswordExpires = Date.now() + 3600000
  await user.save()
  const resetURL = `http://${req.headers
    .host}/account/reset/${user.resetPasswordToken}`
  req.flash(
    'success',
    `You have been emailed a password reset link. ${resetURL}`
  )
  res.redirect('/login')
}

const reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  })
  if (!user) {
    req.flash('error', 'Password reset token is invalid or has expired')
    return res.redirect('/login')
  }
  res.render('reset', { title: 'Reset your Password' })
}

const confirmedPasswords = (req, res, next) => {
  req
    .checkBody('password-confirm', 'Your passwords do not match')
    .equals(req.body.password)
  const errors = req.validationErrors()
  if (errors) {
    req.flash('error', errors.map(err => err.msg))
    res.redirect('back')
    return
  }
  next()
}

const update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  })
  if (!user) {
    req.flash('error', 'Password reset token is invalid or has expired')
    return res.redirect('/login')
  }
  const setPassword = promisify(user.setPassword, user)
  await setPassword(req.body.password)
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  const updatedUser = await user.save()
  await req.login(updatedUser)
  req.flash('success', 'Nice! Your password has been reset!')
  res.redirect('/')
}

module.exports = {
  login,
  logout,
  isLoggedIn,
  forgot,
  reset,
  confirmedPasswords,
  update,
}
