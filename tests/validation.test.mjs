// Unit tests for js/validation.js — run with: node --test "tests/**/*.test.mjs"
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MIN_PASSWORD_LENGTH } from '../js/config.js';
import { validateConfirm, validateEmail, validateFullName, validatePassword } from '../js/validation.js';

describe('validateEmail', () => {
  it('requires a well-formed email', () => {
    assert.equal(validateEmail(''), 'Email wajib diisi.');
    assert.equal(validateEmail('   '), 'Email wajib diisi.');
    assert.equal(validateEmail('bidan.siti'), 'Format email belum benar.');
    assert.equal(validateEmail('bidan@siti'), 'Format email belum benar.');
    assert.equal(validateEmail(' bidan.siti@example.com '), '');
  });
});

describe('validatePassword', () => {
  it(`needs at least ${MIN_PASSWORD_LENGTH} characters`, () => {
    assert.equal(validatePassword(''), 'Kata sandi wajib diisi.');
    assert.equal(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH - 1)), `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`);
    assert.equal(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH)), '');
  });
});

describe('validateFullName', () => {
  it('requires a name of at most 120 characters', () => {
    assert.equal(validateFullName('  '), 'Nama lengkap wajib diisi.');
    assert.equal(validateFullName('a'.repeat(121)), 'Nama terlalu panjang.');
    assert.equal(validateFullName('Siti Rahma'), '');
  });
});

describe('validateConfirm', () => {
  it('asks for the same password again', () => {
    assert.equal(validateConfirm('rahasia123', ''), 'Ketik ulang kata sandi Anda.');
    assert.equal(validateConfirm('rahasia123', 'rahasia124'), 'Kata sandi tidak sama.');
    assert.equal(validateConfirm('rahasia123', 'rahasia123'), '');
  });
});
