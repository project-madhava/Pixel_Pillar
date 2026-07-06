#include "AriesPWM.h"

#define CLOCK_PIN 16
#define DATA_PIN  17
#define CS_PIN    18

AriesPWM_Matrix display(3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14);
uint8_t imageBuffer[102400]; 
int scrollX = 0;
bool isScrolling = false;
int scrollSpeed = 5;
unsigned long frameCount = 0;

void setup() { 
    display.begin(); 
    Serial.begin(115200); 
    pinMode(CLOCK_PIN, INPUT); pinMode(DATA_PIN, INPUT); pinMode(CS_PIN, INPUT_PULLUP);
    
    Serial.println("\n--- Aries True Color PWM Receiver ---");
    Serial.println("✅ Hardware Initialized. Waiting for ESP32 connection...");
}

void loop() {
    if (digitalRead(CS_PIN) == LOW) {
        Serial.println("\n🔗 ESP32 Connection Detected (CS LOW). Waking up...");
        
        long pixelBytes = 0; 
        uint8_t header[5] = {0,0,0,0,0};
        bool synced = false;
        int hIdx = 0;
        int garbageCount = 0;
        
        while (digitalRead(CS_PIN) == LOW && pixelBytes < 102400) {
            uint8_t receivedByte = 0;
            for (int i = 0; i < 8; i++) {
                unsigned long timeout = micros();
                
                while (digitalRead(CLOCK_PIN) == LOW) { 
                    if (digitalRead(CS_PIN) == HIGH || micros() - timeout > 5000000) {
                        Serial.println("❌ Transfer aborted during LOW clock wait.");
                        goto transfer_end; 
                    }
                }
                
                if (digitalRead(DATA_PIN) == HIGH) receivedByte |= (1 << i);
                timeout = micros();
                
                while (digitalRead(CLOCK_PIN) == HIGH) { 
                    if (micros() - timeout > 5000000) {
                        Serial.println("❌ Transfer aborted during HIGH clock wait.");
                        goto transfer_end; 
                    }
                }
            }
            
            // SMART-SYNC LOGIC: Hunt for the 0xAA password
            if (!synced) {
                if (hIdx == 0) {
                    if (receivedByte == 0xAA) {
                        header[0] = 0xAA;
                        hIdx = 1; // Found the start! Move to next header byte
                    } else {
                        garbageCount++; // Throw away HTTP junk bytes
                    }
                } else {
                    header[hIdx] = receivedByte;
                    hIdx++;
                    if (hIdx == 5) synced = true; // Header complete!
                }
            } else {
                imageBuffer[pixelBytes] = receivedByte;
                pixelBytes++;
            }
        }
        
        transfer_end:
        if (synced && pixelBytes == 102400) {
            isScrolling = (header[1] == 1);
            scrollSpeed = constrain(header[2], 1, 10);
            scrollX = 0;
            
            Serial.println("✅ Smart-Sync Payload successfully received!");
            if (garbageCount > 0) {
                Serial.print("⚠️ Auto-Healed: Skipped "); Serial.print(garbageCount); Serial.println(" garbage bytes from Cloud.");
            }
            Serial.print("➡️ Mode: "); Serial.print(isScrolling ? "Panoramic Scrolling" : "Static Image");
            Serial.print(" | Speed: "); Serial.println(scrollSpeed);
            Serial.println("🚀 Display updated with new True Color content!");
        } else {
            Serial.println("⚠️ Incomplete or corrupt data received.");
            Serial.print("   -> Locked onto Header? "); Serial.println(synced ? "Yes" : "No");
            Serial.print("   -> First byte found: 0x"); Serial.println(header[0], HEX);
            Serial.print("   -> Garbage bytes skipped: "); Serial.println(garbageCount);
            Serial.print("   -> Pixel Bytes caught: "); Serial.println(pixelBytes);
        }
        Serial.println("⏳ Rendering and waiting for next upload...");
    }

    // DRAW THE FRAME TO THE BUFFER
    display.clear();
    int byteIdx = 0;
    for(int y = 0; y < 160; y++) {
        for(int x = 0; x < 320; x++) {
            uint16_t color = (imageBuffer[byteIdx] << 8) | imageBuffer[byteIdx+1];
            byteIdx += 2;
            int drawX = isScrolling ? (x + scrollX) : x;
            display.drawPixelVert(drawX, y, (color >> 8) & 0x0F, (color >> 4) & 0x0F, color & 0x0F);
        }
    }
    
    // SMOOTH PWM REFRESH AND SCROLL MATH
    for(int i = 0; i < 15; i++) display.refreshBAM();
    
    if (isScrolling) {
        frameCount++;
        if (frameCount % (11 - scrollSpeed) == 0) {
            scrollX--; 
            if(scrollX < -320) scrollX = 0; 
        }
    }
}
