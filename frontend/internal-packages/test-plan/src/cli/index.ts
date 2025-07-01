#!/usr/bin/env node
import { analyzeCommand } from './analyzeCommand.js'

analyzeCommand.parse(process.argv)
