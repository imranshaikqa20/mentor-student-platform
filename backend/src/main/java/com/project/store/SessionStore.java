package com.project.store;

import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

public class SessionStore {
    public static final Map<String, String> codeMap = new ConcurrentHashMap<>();
}